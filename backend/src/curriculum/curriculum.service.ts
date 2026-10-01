import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository, type FindOptionsWhere } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { CourseType } from '../courses/course-type.entity.js';
import { Location } from '../locations/location.entity.js';
import { AuditService, snapshot } from '../system/audit.service.js';
import { Cohort } from './cohort.entity.js';
import { CurriculumModulePrerequisite } from './curriculum-module-prerequisite.entity.js';
import { CurriculumModule } from './curriculum-module.entity.js';
import type {
  CreateCohortDto,
  CreateCurriculumModuleDto,
  CreateTimeWindowDto,
  ListModulesQuery,
  ListTimeWindowsQuery,
  UpdateCohortDto,
  UpdateCurriculumModuleDto,
  UpdateTimeWindowDto,
} from './dto/curriculum.dto.js';
import { TimeWindow } from './time-window.entity.js';

type CourseTypeRef = Pick<CourseType, 'id' | 'code' | 'name' | 'durationDays'>;

export interface CurriculumModuleView {
  id: string;
  track: CurriculumModule['track'];
  semester: number;
  sequence: number;
  active: boolean;
  courseType: CourseTypeRef;
  prerequisites: { id: string; code: string; name: string }[];
}

export interface TimeWindowView {
  id: string;
  curriculumModule: {
    id: string;
    semester: number;
    sequence: number;
    courseType: CourseTypeRef;
  };
  cohort: Pick<Cohort, 'id' | 'label' | 'track' | 'startYear'>;
  startsOn: string;
  endsOn: string;
  location: Pick<Location, 'id' | 'code' | 'name'> | null;
  note: string | null;
}

@Injectable()
export class CurriculumService {
  constructor(
    @InjectRepository(CurriculumModule)
    private readonly modules: Repository<CurriculumModule>,
    @InjectRepository(CurriculumModulePrerequisite)
    private readonly prerequisites: Repository<CurriculumModulePrerequisite>,
    @InjectRepository(Cohort) private readonly cohorts: Repository<Cohort>,
    @InjectRepository(TimeWindow)
    private readonly windows: Repository<TimeWindow>,
    @InjectRepository(CourseType)
    private readonly courseTypes: Repository<CourseType>,
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
    private readonly ds: DataSource,
    private readonly audit: AuditService,
  ) {}

  // --- Modules ------------------------------------------------------------

  async listModules(query: ListModulesQuery): Promise<CurriculumModuleView[]> {
    const where: FindOptionsWhere<CurriculumModule> = {};
    if (query.track) where.track = query.track;
    const modules = await this.modules.find({
      where,
      relations: { courseType: true },
      order: { track: 'ASC', semester: 'ASC', sequence: 'ASC' },
    });
    const links = await this.prerequisites.find({
      relations: { prerequisiteModule: { courseType: true } },
    });
    return modules.map((m) => toModuleView(m, links));
  }

  async getModule(id: string): Promise<CurriculumModuleView> {
    const module = await this.loadModule(id);
    const links = await this.prerequisites.find({
      where: { moduleId: id },
      relations: { prerequisiteModule: { courseType: true } },
    });
    return toModuleView(module, links);
  }

  async createModule(
    dto: CreateCurriculumModuleDto,
    actor: AuthUser,
  ): Promise<CurriculumModuleView> {
    await this.assertCourseTypeForTrack(dto.courseTypeId, dto.track);
    const prerequisiteIds = [...new Set(dto.prerequisiteModuleIds ?? [])];
    await this.assertModules(prerequisiteIds, dto.track);
    const module = this.modules.create({
      track: dto.track,
      courseTypeId: dto.courseTypeId,
      semester: dto.semester,
      sequence: dto.sequence,
      active: dto.active ?? true,
    });
    await this.ds.transaction(async (em) => {
      await em.save(module);
      if (prerequisiteIds.length) {
        await em.insert(
          CurriculumModulePrerequisite,
          prerequisiteIds.map((prerequisiteModuleId) => ({
            moduleId: module.id,
            prerequisiteModuleId,
          })),
        );
      }
    });
    const view = await this.getModule(module.id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'curriculum_module',
      entityId: module.id,
      action: 'create',
      after: { ...snapshot(module), prerequisiteModuleIds: prerequisiteIds },
      summary: `hat ÜK-Modul «${view.courseType.code}» (${dto.track.toUpperCase()}, Semester ${dto.semester}) angelegt`,
    });
    return view;
  }

  async updateModule(
    id: string,
    dto: UpdateCurriculumModuleDto,
    actor: AuthUser,
  ): Promise<CurriculumModuleView> {
    const module = await this.loadModule(id);
    const before = await this.getModule(id);
    const track = dto.track ?? module.track;
    if (dto.courseTypeId || dto.track) {
      await this.assertCourseTypeForTrack(
        dto.courseTypeId ?? module.courseTypeId,
        track,
      );
    }
    const prerequisiteIds =
      dto.prerequisiteModuleIds === undefined
        ? undefined
        : [...new Set(dto.prerequisiteModuleIds)];
    if (prerequisiteIds) {
      if (prerequisiteIds.includes(id)) {
        throw new BadRequestException(
          'Ein Modul kann nicht sich selbst voraussetzen.',
        );
      }
      await this.assertModules(prerequisiteIds, track);
    }
    const { prerequisiteModuleIds: _ignored, ...columns } = dto;
    void _ignored;
    this.modules.merge(module, columns);
    await this.ds.transaction(async (em) => {
      await em.save(module);
      if (prerequisiteIds) {
        await em.delete(CurriculumModulePrerequisite, { moduleId: id });
        if (prerequisiteIds.length) {
          await em.insert(
            CurriculumModulePrerequisite,
            prerequisiteIds.map((prerequisiteModuleId) => ({
              moduleId: id,
              prerequisiteModuleId,
            })),
          );
        }
      }
    });
    const view = await this.getModule(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'curriculum_module',
      entityId: id,
      action: 'update',
      before: { ...before },
      after: { ...view },
      summary: `hat ÜK-Modul «${view.courseType.code}» geändert`,
    });
    return view;
  }

  async removeModule(id: string, actor: AuthUser): Promise<void> {
    const view = await this.getModule(id);
    await this.modules.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'curriculum_module',
      entityId: id,
      action: 'delete',
      before: { ...view },
      summary: `hat ÜK-Modul «${view.courseType.code}» gelöscht`,
    });
  }

  // --- Cohorts ------------------------------------------------------------

  listCohorts(): Promise<Cohort[]> {
    return this.cohorts.find({ order: { startYear: 'DESC', track: 'ASC' } });
  }

  async createCohort(dto: CreateCohortDto, actor: AuthUser): Promise<Cohort> {
    const cohort = this.cohorts.create(dto);
    await this.cohorts.save(cohort);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'cohort',
      entityId: cohort.id,
      action: 'create',
      after: snapshot(cohort),
      summary: `hat Jahrgang «${cohort.label}» angelegt`,
    });
    return cohort;
  }

  async updateCohort(
    id: string,
    dto: UpdateCohortDto,
    actor: AuthUser,
  ): Promise<Cohort> {
    const cohort = await this.loadCohort(id);
    const before = snapshot(cohort);
    this.cohorts.merge(cohort, dto);
    await this.cohorts.save(cohort);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'cohort',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(cohort),
      summary: `hat Jahrgang «${cohort.label}» geändert`,
    });
    return cohort;
  }

  async removeCohort(id: string, actor: AuthUser): Promise<void> {
    const cohort = await this.loadCohort(id);
    await this.cohorts.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'cohort',
      entityId: id,
      action: 'delete',
      before: snapshot(cohort),
      summary: `hat Jahrgang «${cohort.label}» gelöscht`,
    });
  }

  // --- Time windows -------------------------------------------------------

  async listTimeWindows(
    query: ListTimeWindowsQuery,
  ): Promise<TimeWindowView[]> {
    const where: FindOptionsWhere<TimeWindow> = {};
    if (query.cohortId) where.cohortId = query.cohortId;
    const windows = await this.windows.find({
      where,
      relations: {
        curriculumModule: { courseType: true },
        cohort: true,
        location: true,
      },
      order: { startsOn: 'ASC' },
    });
    return windows.map(toWindowView);
  }

  async createTimeWindow(
    dto: CreateTimeWindowDto,
    actor: AuthUser,
  ): Promise<TimeWindowView> {
    const module = await this.loadModule(dto.curriculumModuleId);
    const cohort = await this.loadCohort(dto.cohortId);
    if (module.track !== cohort.track) {
      throw new BadRequestException(
        'Modul und Jahrgang gehören nicht zum selben Lehrgang.',
      );
    }
    if (
      dto.locationId &&
      !(await this.locations.existsBy({ id: dto.locationId }))
    ) {
      throw new BadRequestException('Unbekannter Standort.');
    }
    assertPeriod(dto.startsOn, dto.endsOn);
    const window = this.windows.create({
      curriculumModuleId: dto.curriculumModuleId,
      cohortId: dto.cohortId,
      startsOn: dto.startsOn,
      endsOn: dto.endsOn,
      locationId: dto.locationId ?? null,
      note: dto.note ?? null,
    });
    await this.windows.save(window);
    const view = await this.getTimeWindow(window.id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'time_window',
      entityId: window.id,
      action: 'create',
      after: snapshot(window),
      summary: `hat Zeitfenster ${dto.startsOn} bis ${dto.endsOn} für «${view.curriculumModule.courseType.code}» (${cohort.label}) angelegt`,
    });
    return view;
  }

  async updateTimeWindow(
    id: string,
    dto: UpdateTimeWindowDto,
    actor: AuthUser,
  ): Promise<TimeWindowView> {
    const window = await this.loadTimeWindow(id);
    const before = snapshot(window);
    if (dto.curriculumModuleId || dto.cohortId) {
      const module = await this.loadModule(
        dto.curriculumModuleId ?? window.curriculumModuleId,
      );
      const cohort = await this.loadCohort(dto.cohortId ?? window.cohortId);
      if (module.track !== cohort.track) {
        throw new BadRequestException(
          'Modul und Jahrgang gehören nicht zum selben Lehrgang.',
        );
      }
    }
    if (
      dto.locationId &&
      !(await this.locations.existsBy({ id: dto.locationId }))
    ) {
      throw new BadRequestException('Unbekannter Standort.');
    }
    this.windows.merge(window, dto);
    assertPeriod(window.startsOn, window.endsOn);
    await this.windows.save(window);
    const view = await this.getTimeWindow(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'time_window',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(window),
      summary: `hat Zeitfenster für «${view.curriculumModule.courseType.code}» (${view.cohort.label}) geändert`,
    });
    return view;
  }

  async removeTimeWindow(id: string, actor: AuthUser): Promise<void> {
    const view = await this.getTimeWindow(id);
    await this.windows.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'time_window',
      entityId: id,
      action: 'delete',
      before: { ...view },
      summary: `hat Zeitfenster für «${view.curriculumModule.courseType.code}» (${view.cohort.label}) gelöscht`,
    });
  }

  // --- Helpers ------------------------------------------------------------

  private async getTimeWindow(id: string): Promise<TimeWindowView> {
    const window = await this.windows.findOne({
      where: { id },
      relations: {
        curriculumModule: { courseType: true },
        cohort: true,
        location: true,
      },
    });
    if (!window) throw new NotFoundException('Zeitfenster nicht gefunden.');
    return toWindowView(window);
  }

  private async loadModule(id: string): Promise<CurriculumModule> {
    const module = await this.modules.findOne({
      where: { id },
      relations: { courseType: true },
    });
    if (!module) throw new NotFoundException('ÜK-Modul nicht gefunden.');
    return module;
  }

  private async loadCohort(id: string): Promise<Cohort> {
    const cohort = await this.cohorts.findOneBy({ id });
    if (!cohort) throw new NotFoundException('Jahrgang nicht gefunden.');
    return cohort;
  }

  private async loadTimeWindow(id: string): Promise<TimeWindow> {
    const window = await this.windows.findOneBy({ id });
    if (!window) throw new NotFoundException('Zeitfenster nicht gefunden.');
    return window;
  }

  private async assertCourseTypeForTrack(
    courseTypeId: string,
    track: CurriculumModule['track'],
  ): Promise<void> {
    const type = await this.courseTypes.findOneBy({ id: courseTypeId });
    if (!type) throw new BadRequestException('Unbekannter Kurstyp.');
    if (type.track !== track) {
      throw new BadRequestException(
        'Der Kurstyp gehört nicht zu diesem Lehrgang.',
      );
    }
  }

  private async assertModules(
    ids: string[],
    track: CurriculumModule['track'],
  ): Promise<void> {
    if (!ids.length) return;
    const found = await this.modules.findBy({ id: In(ids) });
    if (found.length !== ids.length)
      throw new BadRequestException('Unbekanntes Modul.');
    if (found.some((m) => m.track !== track)) {
      throw new BadRequestException(
        'Voraussetzungen müssen zum selben Lehrgang gehören.',
      );
    }
  }
}

function toModuleView(
  m: CurriculumModule,
  links: CurriculumModulePrerequisite[],
): CurriculumModuleView {
  return {
    id: m.id,
    track: m.track,
    semester: m.semester,
    sequence: m.sequence,
    active: m.active,
    courseType: courseTypeRef(m.courseType),
    prerequisites: links
      .filter((l) => l.moduleId === m.id)
      .map((l) => ({
        id: l.prerequisiteModule.id,
        code: l.prerequisiteModule.courseType.code,
        name: l.prerequisiteModule.courseType.name,
      }))
      .sort((a, b) => a.code.localeCompare(b.code)),
  };
}

function toWindowView(w: TimeWindow): TimeWindowView {
  return {
    id: w.id,
    curriculumModule: {
      id: w.curriculumModule.id,
      semester: w.curriculumModule.semester,
      sequence: w.curriculumModule.sequence,
      courseType: courseTypeRef(w.curriculumModule.courseType),
    },
    cohort: {
      id: w.cohort.id,
      label: w.cohort.label,
      track: w.cohort.track,
      startYear: w.cohort.startYear,
    },
    startsOn: w.startsOn,
    endsOn: w.endsOn,
    location: w.location
      ? { id: w.location.id, code: w.location.code, name: w.location.name }
      : null,
    note: w.note,
  };
}

function courseTypeRef(t: CourseType): CourseTypeRef {
  return { id: t.id, code: t.code, name: t.name, durationDays: t.durationDays };
}

function assertPeriod(startsOn: string, endsOn: string): void {
  if (startsOn > endsOn) {
    throw new BadRequestException('Das Enddatum liegt vor dem Startdatum.');
  }
}
