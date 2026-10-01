import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { CurriculumModule } from '../curriculum/curriculum-module.entity.js';
import { DeviceType } from '../devices/device-type.entity.js';
import { CertificateType } from '../instructors/certificate-type.entity.js';
import { Skill } from '../instructors/skill.entity.js';
import { AuditService, snapshot } from '../system/audit.service.js';
import { CourseTypeCertificate } from './course-type-certificate.entity.js';
import { CourseTypeDevice } from './course-type-device.entity.js';
import { CourseTypeSkill } from './course-type-skill.entity.js';
import { CourseType } from './course-type.entity.js';
import type {
  CreateCourseTypeDto,
  ReplaceRequirementsDto,
  UpdateCourseTypeDto,
} from './dto/course-type.dto.js';

/** A course type as the catalogue shows it: with its requirements and curriculum slot. */
export interface CourseTypeView {
  id: string;
  code: string;
  name: string;
  kind: CourseType['kind'];
  track: CourseType['track'];
  durationDays: number;
  maySpanWeeks: boolean;
  weekdayRule: CourseType['weekdayRule'];
  languages: CourseType['languages'];
  minParticipants: number | null;
  maxParticipants: number;
  description: string | null;
  published: boolean;
  active: boolean;
  requiredSkills: Pick<Skill, 'id' | 'name'>[];
  requiredCertificates: Pick<CertificateType, 'id' | 'code' | 'name'>[];
  requiredDevices: {
    deviceType: Pick<DeviceType, 'id' | 'code' | 'name'>;
    quantity: number;
  }[];
  curriculumModule: {
    id: string;
    track: CurriculumModule['track'];
    semester: number;
    sequence: number;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CourseTypesService {
  constructor(
    @InjectRepository(CourseType)
    private readonly types: Repository<CourseType>,
    @InjectRepository(CurriculumModule)
    private readonly modules: Repository<CurriculumModule>,
    @InjectRepository(Skill) private readonly skills: Repository<Skill>,
    @InjectRepository(CertificateType)
    private readonly certificateTypes: Repository<CertificateType>,
    @InjectRepository(DeviceType)
    private readonly deviceTypes: Repository<DeviceType>,
    private readonly ds: DataSource,
    private readonly audit: AuditService,
  ) {}

  async list(): Promise<CourseTypeView[]> {
    const types = await this.types.find({
      relations: this.relations,
      order: { code: 'ASC' },
    });
    const modules = await this.modules.find();
    return types.map((t) =>
      this.toView(t, modules.find((m) => m.courseTypeId === t.id) ?? null),
    );
  }

  async get(id: string): Promise<CourseTypeView> {
    const type = await this.load(id);
    const module = await this.modules.findOneBy({ courseTypeId: id });
    return this.toView(type, module);
  }

  async create(
    dto: CreateCourseTypeDto,
    actor: AuthUser,
  ): Promise<CourseTypeView> {
    assertParticipants(dto.minParticipants, dto.maxParticipants);
    const type = this.types.create(dto);
    await this.types.save(type);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'course_type',
      entityId: type.id,
      action: 'create',
      after: snapshot(type),
      summary: `hat Kurstyp «${type.code} ${type.name}» angelegt`,
    });
    return this.get(type.id);
  }

  async update(
    id: string,
    dto: UpdateCourseTypeDto,
    actor: AuthUser,
  ): Promise<CourseTypeView> {
    const type = await this.load(id);
    const before = snapshot(type);
    this.types.merge(type, dto);
    assertParticipants(type.minParticipants, type.maxParticipants);
    await this.types.save(type);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'course_type',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(type),
      summary: `hat Kurstyp «${type.code} ${type.name}» geändert`,
    });
    return this.get(id);
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    const type = await this.load(id);
    await this.types.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'course_type',
      entityId: id,
      action: 'delete',
      before: snapshot(type),
      summary: `hat Kurstyp «${type.code} ${type.name}» gelöscht`,
    });
  }

  /** Replaces the required skills, certificate types and device types (with quantity). */
  async replaceRequirements(
    id: string,
    dto: ReplaceRequirementsDto,
    actor: AuthUser,
  ): Promise<CourseTypeView> {
    const type = await this.load(id);
    const skillIds = [...new Set(dto.skillIds)];
    const certIds = [...new Set(dto.certificateTypeIds)];
    const devices = new Map(
      dto.devices.map((d) => [d.deviceTypeId, d.quantity]),
    );
    await this.assertAll(this.skills, skillIds, 'Unbekannter Skill.');
    await this.assertAll(
      this.certificateTypes,
      certIds,
      'Unbekannter Zertifikatstyp.',
    );
    await this.assertAll(
      this.deviceTypes,
      [...devices.keys()],
      'Unbekannter Gerätetyp.',
    );

    await this.ds.transaction(async (em) => {
      await em.delete(CourseTypeSkill, { courseTypeId: id });
      await em.delete(CourseTypeCertificate, { courseTypeId: id });
      await em.delete(CourseTypeDevice, { courseTypeId: id });
      if (skillIds.length) {
        await em.insert(
          CourseTypeSkill,
          skillIds.map((skillId) => ({ courseTypeId: id, skillId })),
        );
      }
      if (certIds.length) {
        await em.insert(
          CourseTypeCertificate,
          certIds.map((certificateTypeId) => ({
            courseTypeId: id,
            certificateTypeId,
          })),
        );
      }
      if (devices.size) {
        await em.insert(
          CourseTypeDevice,
          [...devices].map(([deviceTypeId, quantity]) => ({
            courseTypeId: id,
            deviceTypeId,
            quantity,
          })),
        );
      }
    });
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'course_type',
      entityId: id,
      action: 'replace_requirements',
      before: {
        skillIds: type.requiredSkills.map((s) => s.skillId),
        certificateTypeIds: type.requiredCertificates.map(
          (c) => c.certificateTypeId,
        ),
        devices: type.requiredDevices.map((d) => ({
          deviceTypeId: d.deviceTypeId,
          quantity: d.quantity,
        })),
      },
      after: { skillIds, certificateTypeIds: certIds, devices: dto.devices },
      summary: `hat die Anforderungen von Kurstyp «${type.code}» gesetzt`,
    });
    return this.get(id);
  }

  private readonly relations = {
    requiredSkills: { skill: true },
    requiredCertificates: { certificateType: true },
    requiredDevices: { deviceType: true },
  } as const;

  private async load(id: string): Promise<CourseType> {
    const type = await this.types.findOne({
      where: { id },
      relations: this.relations,
    });
    if (!type) throw new NotFoundException('Kurstyp nicht gefunden.');
    return type;
  }

  private async assertAll<T extends { id: string }>(
    repo: Repository<T>,
    ids: string[],
    message: string,
  ): Promise<void> {
    if (!ids.length) return;
    const count = await repo.countBy({ id: In(ids) } as never);
    if (count !== ids.length) throw new BadRequestException(message);
  }

  private toView(
    t: CourseType,
    module: CurriculumModule | null,
  ): CourseTypeView {
    return {
      id: t.id,
      code: t.code,
      name: t.name,
      kind: t.kind,
      track: t.track,
      durationDays: t.durationDays,
      maySpanWeeks: t.maySpanWeeks,
      weekdayRule: t.weekdayRule,
      languages: t.languages,
      minParticipants: t.minParticipants,
      maxParticipants: t.maxParticipants,
      description: t.description,
      published: t.published,
      active: t.active,
      requiredSkills: (t.requiredSkills ?? [])
        .map((s) => ({ id: s.skill.id, name: s.skill.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      requiredCertificates: (t.requiredCertificates ?? [])
        .map((c) => ({
          id: c.certificateType.id,
          code: c.certificateType.code,
          name: c.certificateType.name,
        }))
        .sort((a, b) => a.code.localeCompare(b.code)),
      requiredDevices: (t.requiredDevices ?? [])
        .map((d) => ({
          deviceType: {
            id: d.deviceType.id,
            code: d.deviceType.code,
            name: d.deviceType.name,
          },
          quantity: d.quantity,
        }))
        .sort((a, b) => a.deviceType.code.localeCompare(b.deviceType.code)),
      curriculumModule: module
        ? {
            id: module.id,
            track: module.track,
            semester: module.semester,
            sequence: module.sequence,
          }
        : null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }
}

function assertParticipants(min: number | null | undefined, max: number): void {
  if (min != null && min > max) {
    throw new BadRequestException(
      'Die Mindestteilnehmerzahl liegt über dem Maximum.',
    );
  }
}
