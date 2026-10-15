import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { Location } from '../locations/location.entity.js';
import { AuditService, snapshot } from '../system/audit.service.js';
import { Apprentice } from './apprentice.entity.js';
import type {
  CreateSchoolClassDto,
  CreateSchoolHolidayDto,
  CreateVocationalSchoolDto,
  ReplaceSchoolClassDaysDto,
  UpdateSchoolClassDto,
  UpdateSchoolHolidayDto,
  UpdateVocationalSchoolDto,
} from './dto/school.dto.js';
import { SchoolClassDay } from './school-class-day.entity.js';
import { SchoolClass } from './school-class.entity.js';
import { SchoolHoliday } from './school-holiday.entity.js';
import { VocationalSchool } from './vocational-school.entity.js';

export interface SchoolClassView {
  id: string;
  code: string;
  track: SchoolClass['track'];
  startYear: number;
  active: boolean;
  days: Pick<
    SchoolClassDay,
    'id' | 'schoolYearStart' | 'weekday' | 'evening'
  >[];
  apprenticeCount: number;
}

export interface VocationalSchoolView {
  id: string;
  name: string;
  shortName: string;
  addressLine: string | null;
  postalCode: string | null;
  city: string | null;
  canton: string | null;
  language: VocationalSchool['language'];
  nearestLocation: Pick<Location, 'id' | 'code' | 'name'>;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  active: boolean;
  classes: SchoolClassView[];
  apprenticeCount: number;
}

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(VocationalSchool)
    private readonly schools: Repository<VocationalSchool>,
    @InjectRepository(SchoolClass)
    private readonly classes: Repository<SchoolClass>,
    @InjectRepository(SchoolClassDay)
    private readonly days: Repository<SchoolClassDay>,
    @InjectRepository(SchoolHoliday)
    private readonly holidays: Repository<SchoolHoliday>,
    @InjectRepository(Apprentice)
    private readonly apprentices: Repository<Apprentice>,
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
    private readonly ds: DataSource,
    private readonly audit: AuditService,
  ) {}

  async list(): Promise<VocationalSchoolView[]> {
    const schools = await this.schools.find({
      relations: { nearestLocation: true },
      order: { name: 'ASC' },
    });
    const classes = await this.classes.find({
      relations: { days: true },
      order: { startYear: 'DESC', code: 'ASC', days: { weekday: 'ASC' } },
    });
    const counts = await this.apprenticeCounts();
    return schools.map((s) =>
      this.toView(
        s,
        classes.filter((c) => c.vocationalSchoolId === s.id),
        counts,
      ),
    );
  }

  async get(id: string): Promise<VocationalSchoolView> {
    const school = await this.load(id);
    const classes = await this.classes.find({
      where: { vocationalSchoolId: id },
      relations: { days: true },
      order: { startYear: 'DESC', code: 'ASC', days: { weekday: 'ASC' } },
    });
    return this.toView(school, classes, await this.apprenticeCounts(id));
  }

  async create(
    dto: CreateVocationalSchoolDto,
    actor: AuthUser,
  ): Promise<VocationalSchoolView> {
    await this.assertLocation(dto.nearestLocationId);
    const school = this.schools.create(dto);
    await this.schools.save(school);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'vocational_school',
      entityId: school.id,
      action: 'create',
      after: snapshot(school),
      summary: `hat Berufsschule «${school.name}» angelegt`,
    });
    return this.get(school.id);
  }

  async update(
    id: string,
    dto: UpdateVocationalSchoolDto,
    actor: AuthUser,
  ): Promise<VocationalSchoolView> {
    const school = await this.load(id);
    if (dto.nearestLocationId) await this.assertLocation(dto.nearestLocationId);
    const before = snapshot(school);
    this.schools.merge(school, dto);
    await this.schools.save(school);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'vocational_school',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(school),
      summary: `hat Berufsschule «${school.name}» geändert`,
    });
    return this.get(id);
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    const school = await this.load(id);
    await this.schools.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'vocational_school',
      entityId: id,
      action: 'delete',
      before: snapshot(school),
      summary: `hat Berufsschule «${school.name}» gelöscht`,
    });
  }

  // --- Classes ------------------------------------------------------------

  async createClass(
    schoolId: string,
    dto: CreateSchoolClassDto,
    actor: AuthUser,
  ): Promise<SchoolClassView> {
    const school = await this.load(schoolId);
    const cls = this.classes.create({
      ...dtoColumns(dto),
      vocationalSchoolId: schoolId,
    });
    await this.classes.save(cls);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'school_class',
      entityId: cls.id,
      action: 'create',
      after: snapshot(cls),
      summary: `hat Klasse «${cls.code}» an ${school.name} angelegt`,
    });
    return this.getClass(cls.id);
  }

  async updateClass(
    id: string,
    dto: UpdateSchoolClassDto,
    actor: AuthUser,
  ): Promise<SchoolClassView> {
    const cls = await this.loadClass(id);
    const before = snapshot(cls);
    this.classes.merge(cls, dtoColumns(dto));
    await this.classes.save(cls);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'school_class',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(cls),
      summary: `hat Klasse «${cls.code}» geändert`,
    });
    return this.getClass(id);
  }

  async removeClass(id: string, actor: AuthUser): Promise<void> {
    const cls = await this.loadClass(id);
    await this.classes.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'school_class',
      entityId: id,
      action: 'delete',
      before: snapshot(cls),
      summary: `hat Klasse «${cls.code}» gelöscht`,
    });
  }

  /** Replaces the school days of a class for one school year (other years untouched). */
  async replaceClassDays(
    id: string,
    dto: ReplaceSchoolClassDaysDto,
    actor: AuthUser,
  ): Promise<SchoolClassView> {
    const cls = await this.loadClass(id);
    const byWeekday = new Map(
      dto.days.map((d) => [d.weekday, d.evening ?? false]),
    );
    await this.ds.transaction(async (em) => {
      await em.delete(SchoolClassDay, {
        schoolClassId: id,
        schoolYearStart: dto.schoolYearStart,
      });
      if (byWeekday.size) {
        await em.insert(
          SchoolClassDay,
          [...byWeekday].map(([weekday, evening]) => ({
            schoolClassId: id,
            schoolYearStart: dto.schoolYearStart,
            weekday,
            evening,
          })),
        );
      }
    });
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'school_class',
      entityId: id,
      action: 'replace_days',
      before: {
        schoolYearStart: dto.schoolYearStart,
        days: cls.days
          .filter((d) => d.schoolYearStart === dto.schoolYearStart)
          .map((d) => ({ weekday: d.weekday, evening: d.evening })),
      },
      after: {
        schoolYearStart: dto.schoolYearStart,
        days: [...byWeekday].map(([weekday, evening]) => ({
          weekday,
          evening,
        })),
      },
      summary: `hat die Schultage ${dto.schoolYearStart}/${String(dto.schoolYearStart + 1).slice(2)} von Klasse «${cls.code}» gesetzt`,
    });
    return this.getClass(id);
  }

  // --- Holidays -----------------------------------------------------------

  async listHolidays(schoolId: string): Promise<SchoolHoliday[]> {
    await this.load(schoolId);
    return this.holidays.find({
      where: { vocationalSchoolId: schoolId },
      order: { startsOn: 'ASC' },
    });
  }

  async createHoliday(
    schoolId: string,
    dto: CreateSchoolHolidayDto,
    actor: AuthUser,
  ): Promise<SchoolHoliday> {
    const school = await this.load(schoolId);
    assertHolidayRange(dto.startsOn, dto.endsOn);
    const holiday = this.holidays.create(dto);
    holiday.vocationalSchoolId = schoolId;
    await this.holidays.save(holiday);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'school_holiday',
      entityId: holiday.id,
      action: 'create',
      after: snapshot(holiday),
      summary: `hat Ferien ${holiday.startsOn} – ${holiday.endsOn} an ${school.name} angelegt`,
    });
    return holiday;
  }

  async updateHoliday(
    id: string,
    dto: UpdateSchoolHolidayDto,
    actor: AuthUser,
  ): Promise<SchoolHoliday> {
    const holiday = await this.loadHoliday(id);
    const before = snapshot(holiday);
    this.holidays.merge(holiday, dto);
    assertHolidayRange(holiday.startsOn, holiday.endsOn);
    await this.holidays.save(holiday);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'school_holiday',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(holiday),
      summary: `hat Ferien ${holiday.startsOn} – ${holiday.endsOn} geändert`,
    });
    return holiday;
  }

  async removeHoliday(id: string, actor: AuthUser): Promise<void> {
    const holiday = await this.loadHoliday(id);
    await this.holidays.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'school_holiday',
      entityId: id,
      action: 'delete',
      before: snapshot(holiday),
      summary: `hat Ferien ${holiday.startsOn} – ${holiday.endsOn} gelöscht`,
    });
  }

  private async loadHoliday(id: string): Promise<SchoolHoliday> {
    const holiday = await this.holidays.findOneBy({ id });
    if (!holiday) throw new NotFoundException('Ferien nicht gefunden.');
    return holiday;
  }

  // --- Helpers ------------------------------------------------------------

  private async getClass(id: string): Promise<SchoolClassView> {
    const cls = await this.loadClass(id);
    const counts = await this.apprenticeCounts();
    return toClassView(cls, counts.classes.get(id) ?? 0);
  }

  private async load(id: string): Promise<VocationalSchool> {
    const school = await this.schools.findOne({
      where: { id },
      relations: { nearestLocation: true },
    });
    if (!school) throw new NotFoundException('Berufsschule nicht gefunden.');
    return school;
  }

  private async loadClass(id: string): Promise<SchoolClass> {
    const cls = await this.classes.findOne({
      where: { id },
      relations: { days: true },
      order: { days: { schoolYearStart: 'ASC', weekday: 'ASC' } },
    });
    if (!cls) throw new NotFoundException('Klasse nicht gefunden.');
    return cls;
  }

  private async assertLocation(id: string): Promise<void> {
    if (!(await this.locations.existsBy({ id }))) {
      throw new BadRequestException('Unbekannter Standort.');
    }
  }

  /** Active apprentices per school and per class. */
  private async apprenticeCounts(
    schoolId?: string,
  ): Promise<{ schools: Map<string, number>; classes: Map<string, number> }> {
    const qb = this.apprentices
      .createQueryBuilder('a')
      .select('a.vocationalSchoolId', 'schoolId')
      .addSelect('a.schoolClassId', 'classId')
      .addSelect('COUNT(*)', 'n')
      .where("a.status = 'active'")
      .groupBy('a.vocationalSchoolId')
      .addGroupBy('a.schoolClassId');
    if (schoolId) qb.andWhere('a.vocationalSchoolId = :schoolId', { schoolId });
    const rows = await qb.getRawMany<{
      schoolId: string;
      classId: string | null;
      n: string;
    }>();
    const schools = new Map<string, number>();
    const classes = new Map<string, number>();
    for (const r of rows) {
      schools.set(r.schoolId, (schools.get(r.schoolId) ?? 0) + Number(r.n));
      if (r.classId)
        classes.set(r.classId, (classes.get(r.classId) ?? 0) + Number(r.n));
    }
    return { schools, classes };
  }

  private toView(
    s: VocationalSchool,
    classes: SchoolClass[],
    counts: { schools: Map<string, number>; classes: Map<string, number> },
  ): VocationalSchoolView {
    return {
      id: s.id,
      name: s.name,
      shortName: s.shortName,
      addressLine: s.addressLine,
      postalCode: s.postalCode,
      city: s.city,
      canton: s.canton,
      language: s.language,
      nearestLocation: {
        id: s.nearestLocation.id,
        code: s.nearestLocation.code,
        name: s.nearestLocation.name,
      },
      contactName: s.contactName,
      contactEmail: s.contactEmail,
      contactPhone: s.contactPhone,
      active: s.active,
      classes: classes.map((c) =>
        toClassView(c, counts.classes.get(c.id) ?? 0),
      ),
      apprenticeCount: counts.schools.get(s.id) ?? 0,
    };
  }
}

function toClassView(c: SchoolClass, apprenticeCount: number): SchoolClassView {
  return {
    id: c.id,
    code: c.code,
    track: c.track,
    startYear: c.startYear,
    active: c.active,
    days: [...(c.days ?? [])]
      .sort(
        (a, b) =>
          a.schoolYearStart - b.schoolYearStart || a.weekday - b.weekday,
      )
      .map((d) => ({
        id: d.id,
        schoolYearStart: d.schoolYearStart,
        weekday: d.weekday,
        evening: d.evening,
      })),
    apprenticeCount,
  };
}

function assertHolidayRange(startsOn: string, endsOn: string): void {
  if (startsOn > endsOn) {
    throw new BadRequestException('Das Startdatum liegt nach dem Enddatum.');
  }
}

function dtoColumns(dto: UpdateSchoolClassDto): Partial<SchoolClass> {
  const columns: Partial<SchoolClass> = {};
  if (dto.code !== undefined) columns.code = dto.code;
  if (dto.track !== undefined) columns.track = dto.track;
  if (dto.startYear !== undefined) columns.startYear = dto.startYear;
  if (dto.active !== undefined) columns.active = dto.active;
  return columns;
}
