import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import {
  AvailabilityKind,
  AvailabilitySource,
  AvailabilityStatus,
  UserRole,
} from '../database/enums.js';
import { Location } from '../locations/location.entity.js';
import { AuditService, snapshot } from '../system/audit.service.js';
import { Availability } from './availability.entity.js';
import { CertificateType } from './certificate-type.entity.js';
import type {
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
} from './dto/availability.dto.js';
import type {
  CreateInstructorCertificateDto,
  UpdateInstructorCertificateDto,
} from './dto/instructor-certificate.dto.js';
import type {
  CreateInstructorDto,
  ListInstructorsQuery,
  UpdateInstructorDto,
} from './dto/instructor.dto.js';
import { InstructorCertificate } from './instructor-certificate.entity.js';
import { InstructorSkill } from './instructor-skill.entity.js';
import { Instructor } from './instructor.entity.js';
import { Skill } from './skill.entity.js';

export type CertificateStatus = 'valid' | 'expiring' | 'expired';

/** A certificate as the UI lists it: with its type and the derived status for today. */
export interface InstructorCertificateView {
  id: string;
  certificateType: Pick<
    CertificateType,
    'id' | 'code' | 'name' | 'issuer' | 'warningLeadDays'
  >;
  issuedOn: string;
  validUntil: string | null;
  documentUrl: string | null;
  notes: string | null;
  status: CertificateStatus;
  daysLeft: number | null;
}

export interface InstructorRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  employmentType: Instructor['employmentType'];
  languages: Instructor['languages'];
  status: Instructor['status'];
  homeLocation: Pick<Location, 'id' | 'code' | 'name'>;
  skills: Pick<Skill, 'id' | 'name'>[];
}

export interface InstructorDetail extends InstructorRow {
  weeklyHours: number | null;
  overtimeCapHours: number | null;
  costRate: number | null;
  maxTravelMinutes: number | null;
  preferences: Instructor['preferences'];
  externalRef: string | null;
  certificates: InstructorCertificateView[];
  availabilities: Availability[];
  createdAt: Date;
  updatedAt: Date;
}

const numeric = (v: number | null | undefined): string | null | undefined =>
  v === undefined ? undefined : v === null ? null : String(v);

@Injectable()
export class InstructorsService {
  constructor(
    @InjectRepository(Instructor)
    private readonly instructors: Repository<Instructor>,
    @InjectRepository(InstructorSkill)
    private readonly instructorSkills: Repository<InstructorSkill>,
    @InjectRepository(InstructorCertificate)
    private readonly certificates: Repository<InstructorCertificate>,
    @InjectRepository(Availability)
    private readonly availabilities: Repository<Availability>,
    @InjectRepository(Skill) private readonly skills: Repository<Skill>,
    @InjectRepository(CertificateType)
    private readonly certificateTypes: Repository<CertificateType>,
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
    private readonly ds: DataSource,
    private readonly audit: AuditService,
  ) {}

  // --- Instructors --------------------------------------------------------

  async list(query: ListInstructorsQuery): Promise<InstructorRow[]> {
    const qb = this.instructors
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.homeLocation', 'loc')
      .leftJoinAndSelect('i.skills', 'is')
      .leftJoinAndSelect('is.skill', 'skill')
      .orderBy('i.lastName', 'ASC')
      .addOrderBy('i.firstName', 'ASC')
      .addOrderBy('skill.name', 'ASC');
    const q = query.q?.trim();
    if (q) {
      qb.andWhere(
        '(i.firstName ILIKE :q OR i.lastName ILIKE :q OR i.email ILIKE :q)',
        { q: `%${q}%` },
      );
    }
    if (query.skillId) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM instructor_skill x WHERE x.instructor_id = i.id AND x.skill_id = :skillId)',
        { skillId: query.skillId },
      );
    }
    if (query.language) {
      qb.andWhere(':language = ANY(i.languages)', { language: query.language });
    }
    if (query.locationId) {
      qb.andWhere('i.homeLocationId = :locationId', {
        locationId: query.locationId,
      });
    }
    if (query.employmentType) {
      qb.andWhere('i.employmentType = :employmentType', {
        employmentType: query.employmentType,
      });
    }
    if (query.status) {
      qb.andWhere('i.status = :status', { status: query.status });
    }
    const rows = await qb.getMany();
    return rows.map((i) => this.toRow(i));
  }

  async get(id: string): Promise<InstructorDetail> {
    const instructor = await this.load(id);
    return this.toDetail(instructor);
  }

  async create(
    dto: CreateInstructorDto,
    actor: AuthUser,
  ): Promise<InstructorDetail> {
    await this.assertLocation(dto.homeLocationId);
    const instructor = this.instructors.create(this.toColumns(dto));
    await this.instructors.save(instructor);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'instructor',
      entityId: instructor.id,
      action: 'create',
      after: snapshot(instructor),
      summary: `hat Ausbilder «${fullName(instructor)}» angelegt`,
    });
    return this.get(instructor.id);
  }

  async update(
    id: string,
    dto: UpdateInstructorDto,
    actor: AuthUser,
  ): Promise<InstructorDetail> {
    const instructor = await this.load(id);
    if (dto.homeLocationId) await this.assertLocation(dto.homeLocationId);
    const before = snapshot(instructor);
    this.instructors.merge(instructor, this.toColumns(dto));
    if (dto.preferences !== undefined) instructor.preferences = dto.preferences;
    await this.instructors.save(instructor);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'instructor',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(instructor),
      summary: `hat Ausbilder «${fullName(instructor)}» geändert`,
    });
    return this.get(id);
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    const instructor = await this.load(id);
    await this.instructors.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'instructor',
      entityId: id,
      action: 'delete',
      before: snapshot(instructor),
      summary: `hat Ausbilder «${fullName(instructor)}» gelöscht`,
    });
  }

  async replaceSkills(
    id: string,
    skillIds: string[],
    actor: AuthUser,
  ): Promise<InstructorDetail> {
    const instructor = await this.load(id);
    const ids = [...new Set(skillIds)];
    const found = ids.length ? await this.skills.findBy({ id: In(ids) }) : [];
    if (found.length !== ids.length) {
      throw new BadRequestException('Unbekannter Skill.');
    }
    await this.ds.transaction(async (em) => {
      await em.delete(InstructorSkill, { instructorId: id });
      if (ids.length) {
        await em.insert(
          InstructorSkill,
          ids.map((skillId) => ({ instructorId: id, skillId })),
        );
      }
    });
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'instructor',
      entityId: id,
      action: 'replace_skills',
      before: { skillIds: instructor.skills.map((s) => s.skillId) },
      after: { skillIds: ids },
      summary: `hat die Skills von «${fullName(instructor)}» auf ${found.map((s) => s.name).join(', ') || 'keine'} gesetzt`,
    });
    return this.get(id);
  }

  // --- Certificates -------------------------------------------------------

  async addCertificate(
    instructorId: string,
    dto: CreateInstructorCertificateDto,
    actor: AuthUser,
  ): Promise<InstructorCertificateView> {
    const instructor = await this.load(instructorId);
    const type = await this.certificateTypes.findOneBy({
      id: dto.certificateTypeId,
    });
    if (!type) throw new BadRequestException('Unbekannter Zertifikatstyp.');
    const certificate = this.certificates.create({
      instructorId,
      certificateTypeId: type.id,
      issuedOn: dto.issuedOn,
      validUntil:
        dto.validUntil === undefined
          ? addYears(dto.issuedOn, type.validityYears)
          : dto.validUntil,
      documentUrl: dto.documentUrl ?? null,
      notes: dto.notes ?? null,
    });
    await this.certificates.save(certificate);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'instructor_certificate',
      entityId: certificate.id,
      action: 'create',
      after: snapshot(certificate),
      summary: `hat Zertifikat «${type.name}» für «${fullName(instructor)}» erfasst`,
    });
    certificate.certificateType = type;
    return toCertificateView(certificate);
  }

  async updateCertificate(
    id: string,
    dto: UpdateInstructorCertificateDto,
    actor: AuthUser,
  ): Promise<InstructorCertificateView> {
    const certificate = await this.certificates.findOne({
      where: { id },
      relations: { certificateType: true },
    });
    if (!certificate) throw new NotFoundException('Zertifikat nicht gefunden.');
    if (
      dto.certificateTypeId &&
      dto.certificateTypeId !== certificate.certificateTypeId
    ) {
      const type = await this.certificateTypes.findOneBy({
        id: dto.certificateTypeId,
      });
      if (!type) throw new BadRequestException('Unbekannter Zertifikatstyp.');
      certificate.certificateType = type;
    }
    const before = snapshot(certificate);
    this.certificates.merge(certificate, dto);
    await this.certificates.save(certificate);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'instructor_certificate',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(certificate),
      summary: `hat Zertifikat «${certificate.certificateType.name}» geändert`,
    });
    return toCertificateView(certificate);
  }

  async removeCertificate(id: string, actor: AuthUser): Promise<void> {
    const certificate = await this.certificates.findOne({
      where: { id },
      relations: { certificateType: true },
    });
    if (!certificate) throw new NotFoundException('Zertifikat nicht gefunden.');
    await this.certificates.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'instructor_certificate',
      entityId: id,
      action: 'delete',
      before: snapshot(certificate),
      summary: `hat Zertifikat «${certificate.certificateType.name}» gelöscht`,
    });
  }

  // --- Availabilities -----------------------------------------------------

  async addAvailability(
    instructorId: string,
    dto: CreateAvailabilityDto,
    actor: AuthUser,
  ): Promise<Availability> {
    const instructor = await this.load(instructorId);
    assertPeriod(dto.startsOn, dto.endsOn);
    const requested = actor.role === UserRole.Instructor;
    const availability = this.availabilities.create({
      instructorId,
      startsOn: dto.startsOn,
      endsOn: dto.endsOn,
      kind: dto.kind,
      status:
        !requested && dto.status
          ? dto.status
          : dto.kind === AvailabilityKind.Vacation
            ? AvailabilityStatus.Requested
            : AvailabilityStatus.Approved,
      source: requested
        ? AvailabilitySource.Request
        : AvailabilitySource.Manual,
      requestedByUserId: actor.dbUserId,
      note: dto.note ?? null,
    });
    await this.availabilities.save(availability);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'availability',
      entityId: availability.id,
      action: 'create',
      after: snapshot(availability),
      summary: `hat ${kindLabel(dto.kind)} ${dto.startsOn} bis ${dto.endsOn} für «${fullName(instructor)}» erfasst`,
    });
    return availability;
  }

  async updateAvailability(
    id: string,
    dto: UpdateAvailabilityDto,
    actor: AuthUser,
  ): Promise<Availability> {
    const availability = await this.loadAvailability(id);
    const before = snapshot(availability);
    this.availabilities.merge(availability, dto);
    assertPeriod(availability.startsOn, availability.endsOn);
    await this.availabilities.save(availability);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'availability',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(availability),
      summary: `hat ${kindLabel(availability.kind)} ${availability.startsOn} bis ${availability.endsOn} geändert`,
    });
    return availability;
  }

  async removeAvailability(id: string, actor: AuthUser): Promise<void> {
    const availability = await this.loadAvailability(id);
    await this.availabilities.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'availability',
      entityId: id,
      action: 'delete',
      before: snapshot(availability),
      summary: `hat ${kindLabel(availability.kind)} ${availability.startsOn} bis ${availability.endsOn} gelöscht`,
    });
  }

  decideAvailability(
    id: string,
    decision: 'approve' | 'reject',
    actor: AuthUser,
  ): Promise<Availability> {
    return this.decide(id, decision, actor);
  }

  private async decide(
    id: string,
    decision: 'approve' | 'reject',
    actor: AuthUser,
  ): Promise<Availability> {
    const availability = await this.loadAvailability(id);
    if (availability.status !== AvailabilityStatus.Requested) {
      throw new ConflictException('Der Antrag ist bereits entschieden.');
    }
    const before = snapshot(availability);
    availability.status =
      decision === 'approve'
        ? AvailabilityStatus.Approved
        : AvailabilityStatus.Rejected;
    availability.decidedByUserId = actor.dbUserId;
    availability.decidedAt = new Date();
    await this.availabilities.save(availability);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'availability',
      entityId: id,
      action: decision,
      before,
      after: snapshot(availability),
      summary: `hat ${kindLabel(availability.kind)} ${availability.startsOn} bis ${availability.endsOn} ${decision === 'approve' ? 'genehmigt' : 'abgelehnt'}`,
    });
    return availability;
  }

  // --- Helpers ------------------------------------------------------------

  private async load(id: string): Promise<Instructor> {
    const instructor = await this.instructors.findOne({
      where: { id },
      relations: {
        homeLocation: true,
        skills: { skill: true },
        certificates: { certificateType: true },
        availabilities: true,
      },
      order: {
        skills: { skill: { name: 'ASC' } },
        certificates: { validUntil: 'ASC' },
        availabilities: { startsOn: 'DESC' },
      },
    });
    if (!instructor) throw new NotFoundException('Ausbilder nicht gefunden.');
    return instructor;
  }

  private async loadAvailability(id: string): Promise<Availability> {
    const availability = await this.availabilities.findOneBy({ id });
    if (!availability) throw new NotFoundException('Absenz nicht gefunden.');
    return availability;
  }

  private async assertLocation(id: string): Promise<void> {
    if (!(await this.locations.existsBy({ id }))) {
      throw new BadRequestException('Unbekannter Standort.');
    }
  }

  /** DTO numbers → the entity's numeric strings; preferences handled by the caller. */
  private toColumns(dto: UpdateInstructorDto): Partial<Instructor> {
    const { weeklyHours, overtimeCapHours, costRate, preferences, ...rest } =
      dto;
    void preferences;
    return {
      ...rest,
      weeklyHours: numeric(weeklyHours),
      overtimeCapHours: numeric(overtimeCapHours),
      costRate: numeric(costRate),
    } as Partial<Instructor>;
  }

  private toRow(i: Instructor): InstructorRow {
    return {
      id: i.id,
      firstName: i.firstName,
      lastName: i.lastName,
      email: i.email,
      phone: i.phone,
      employmentType: i.employmentType,
      languages: i.languages,
      status: i.status,
      homeLocation: {
        id: i.homeLocation.id,
        code: i.homeLocation.code,
        name: i.homeLocation.name,
      },
      skills: (i.skills ?? [])
        .map((s) => ({ id: s.skill.id, name: s.skill.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  private toDetail(i: Instructor): InstructorDetail {
    return {
      ...this.toRow(i),
      weeklyHours: i.weeklyHours === null ? null : Number(i.weeklyHours),
      overtimeCapHours:
        i.overtimeCapHours === null ? null : Number(i.overtimeCapHours),
      costRate: i.costRate === null ? null : Number(i.costRate),
      maxTravelMinutes: i.maxTravelMinutes,
      preferences: i.preferences,
      externalRef: i.externalRef,
      certificates: (i.certificates ?? []).map(toCertificateView),
      availabilities: i.availabilities ?? [],
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    };
  }
}

function fullName(i: Pick<Instructor, 'firstName' | 'lastName'>): string {
  return `${i.firstName} ${i.lastName}`;
}

function kindLabel(kind: AvailabilityKind): string {
  const labels: Record<AvailabilityKind, string> = {
    vacation: 'Ferien',
    training: 'Weiterbildung',
    sick: 'Krankheit',
    blocked: 'Sperre',
    available: 'Verfügbarkeit',
  };
  return labels[kind];
}

function assertPeriod(startsOn: string, endsOn: string): void {
  if (startsOn > endsOn) {
    throw new BadRequestException('Das Enddatum liegt vor dem Startdatum.');
  }
}

/** `issuedOn` plus the type's validity; null when the type does not expire. */
function addYears(issuedOn: string, years: number | null): string | null {
  if (years === null) return null;
  const [y, m, d] = issuedOn.split('-').map(Number);
  return `${String(y + years).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Status for today from `validUntil` and the type's warning lead time. */
export function certificateStatus(
  validUntil: string | null,
  warningLeadDays: number,
  today = new Date(),
): { status: CertificateStatus; daysLeft: number | null } {
  if (validUntil === null) return { status: 'valid', daysLeft: null };
  const until = Date.parse(validUntil);
  const start = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const daysLeft = Math.floor((until - start) / 864e5);
  if (daysLeft < 0) return { status: 'expired', daysLeft };
  if (daysLeft < warningLeadDays) return { status: 'expiring', daysLeft };
  return { status: 'valid', daysLeft };
}

function toCertificateView(
  c: InstructorCertificate,
): InstructorCertificateView {
  const t = c.certificateType;
  return {
    id: c.id,
    certificateType: {
      id: t.id,
      code: t.code,
      name: t.name,
      issuer: t.issuer,
      warningLeadDays: t.warningLeadDays,
    },
    issuedOn: c.issuedOn,
    validUntil: c.validUntil,
    documentUrl: c.documentUrl,
    notes: c.notes,
    ...certificateStatus(c.validUntil, t.warningLeadDays),
  };
}
