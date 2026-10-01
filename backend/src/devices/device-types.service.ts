import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { CertificateType } from '../instructors/certificate-type.entity.js';
import { Skill } from '../instructors/skill.entity.js';
import { AuditService, snapshot } from '../system/audit.service.js';
import { DeviceTypeQualification } from './device-type-qualification.entity.js';
import { DeviceType } from './device-type.entity.js';
import type {
  CreateDeviceTypeDto,
  UpdateDeviceTypeDto,
} from './dto/device-type.dto.js';

/** A device type with what qualifies an instructor for it. */
export type DeviceTypeView = DeviceType & {
  qualifications: {
    certificateTypes: Pick<CertificateType, 'id' | 'code' | 'name'>[];
    skills: Pick<Skill, 'id' | 'name'>[];
  };
};

@Injectable()
export class DeviceTypesService {
  constructor(
    @InjectRepository(DeviceType)
    private readonly types: Repository<DeviceType>,
    @InjectRepository(DeviceTypeQualification)
    private readonly qualifications: Repository<DeviceTypeQualification>,
    @InjectRepository(CertificateType)
    private readonly certificateTypes: Repository<CertificateType>,
    @InjectRepository(Skill) private readonly skills: Repository<Skill>,
    private readonly ds: DataSource,
    private readonly audit: AuditService,
  ) {}

  async list(): Promise<DeviceTypeView[]> {
    const types = await this.types.find({ order: { code: 'ASC' } });
    const links = await this.qualifications.find({
      relations: { certificateType: true, skill: true },
    });
    return types.map((t) => this.withQualifications(t, links));
  }

  async get(id: string): Promise<DeviceTypeView> {
    const type = await this.types.findOneBy({ id });
    if (!type) throw new NotFoundException('Gerätetyp nicht gefunden.');
    const links = await this.qualifications.find({
      where: { deviceTypeId: id },
      relations: { certificateType: true, skill: true },
    });
    return this.withQualifications(type, links);
  }

  async create(
    dto: CreateDeviceTypeDto,
    actor: AuthUser,
  ): Promise<DeviceTypeView> {
    const type = await this.types.save(this.types.create(dto));
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'device_type',
      entityId: type.id,
      action: 'create',
      after: snapshot(type),
      summary: `hat Gerätetyp «${type.name}» angelegt`,
    });
    return this.get(type.id);
  }

  async update(
    id: string,
    dto: UpdateDeviceTypeDto,
    actor: AuthUser,
  ): Promise<DeviceTypeView> {
    const type = await this.get(id);
    const before = snapshot(type);
    this.types.merge(type, dto);
    await this.types.save(type);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'device_type',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(type),
      summary: `hat Gerätetyp «${type.name}» geändert`,
    });
    return this.get(id);
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    const type = await this.get(id);
    await this.types.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'device_type',
      entityId: id,
      action: 'delete',
      before: snapshot(type),
      summary: `hat Gerätetyp «${type.name}» gelöscht`,
    });
  }

  /** Replaces the certificate types and skills that qualify for the device type. */
  async replaceQualifications(
    id: string,
    certificateTypeIds: string[],
    skillIds: string[],
    actor: AuthUser,
  ): Promise<DeviceTypeView> {
    const type = await this.get(id);
    const certIds = [...new Set(certificateTypeIds)];
    const skillIdSet = [...new Set(skillIds)];
    const certs = certIds.length
      ? await this.certificateTypes.findBy({ id: In(certIds) })
      : [];
    if (certs.length !== certIds.length) {
      throw new BadRequestException('Unbekannter Zertifikatstyp.');
    }
    const skills = skillIdSet.length
      ? await this.skills.findBy({ id: In(skillIdSet) })
      : [];
    if (skills.length !== skillIdSet.length) {
      throw new BadRequestException('Unbekannter Skill.');
    }
    await this.ds.transaction(async (em) => {
      await em.delete(DeviceTypeQualification, { deviceTypeId: id });
      const rows = [
        ...certIds.map((certificateTypeId) => ({
          deviceTypeId: id,
          certificateTypeId,
          skillId: null,
        })),
        ...skillIdSet.map((skillId) => ({
          deviceTypeId: id,
          certificateTypeId: null,
          skillId,
        })),
      ];
      if (rows.length) await em.insert(DeviceTypeQualification, rows);
    });
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'device_type',
      entityId: id,
      action: 'replace_qualifications',
      before: {
        certificateTypeIds: type.qualifications.certificateTypes.map(
          (c) => c.id,
        ),
        skillIds: type.qualifications.skills.map((s) => s.id),
      },
      after: { certificateTypeIds: certIds, skillIds: skillIdSet },
      summary: `hat die Qualifikationen für «${type.name}» gesetzt`,
    });
    return this.get(id);
  }

  private withQualifications(
    type: DeviceType,
    links: DeviceTypeQualification[],
  ): DeviceTypeView {
    const own = links.filter((l) => l.deviceTypeId === type.id);
    return Object.assign(type, {
      qualifications: {
        certificateTypes: own
          .filter((l) => l.certificateType)
          .map((l) => ({
            id: l.certificateType!.id,
            code: l.certificateType!.code,
            name: l.certificateType!.name,
          })),
        skills: own
          .filter((l) => l.skill)
          .map((l) => ({ id: l.skill!.id, name: l.skill!.name })),
      },
    });
  }
}
