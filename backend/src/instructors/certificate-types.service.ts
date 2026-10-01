import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { CourseType } from '../courses/course-type.entity.js';
import { AuditService, snapshot } from '../system/audit.service.js';
import { CertificateTypeMaintenanceCourseType } from './certificate-type-maintenance-course-type.entity.js';
import { CertificateType } from './certificate-type.entity.js';
import type {
  CreateCertificateTypeDto,
  UpdateCertificateTypeDto,
} from './dto/certificate-type.dto.js';

/** A certificate type with the course types that count towards its maintenance rule. */
export type CertificateTypeView = CertificateType & {
  maintenanceCourseTypes: Pick<CourseType, 'id' | 'code' | 'name'>[];
};

@Injectable()
export class CertificateTypesService {
  constructor(
    @InjectRepository(CertificateType)
    private readonly types: Repository<CertificateType>,
    @InjectRepository(CertificateTypeMaintenanceCourseType)
    private readonly maintenance: Repository<CertificateTypeMaintenanceCourseType>,
    @InjectRepository(CourseType)
    private readonly courseTypes: Repository<CourseType>,
    private readonly ds: DataSource,
    private readonly audit: AuditService,
  ) {}

  async list(): Promise<CertificateTypeView[]> {
    const types = await this.types.find({ order: { code: 'ASC' } });
    const links = await this.maintenance.find({
      relations: { courseType: true },
    });
    return types.map((t) => this.withMaintenance(t, links));
  }

  async get(id: string): Promise<CertificateTypeView> {
    const type = await this.types.findOneBy({ id });
    if (!type) throw new NotFoundException('Zertifikatstyp nicht gefunden.');
    const links = await this.maintenance.find({
      where: { certificateTypeId: id },
      relations: { courseType: true },
    });
    return this.withMaintenance(type, links);
  }

  async create(
    dto: CreateCertificateTypeDto,
    actor: AuthUser,
  ): Promise<CertificateTypeView> {
    const type = await this.types.save(this.types.create(dto));
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'certificate_type',
      entityId: type.id,
      action: 'create',
      after: snapshot(type),
      summary: `hat Zertifikatstyp «${type.name}» angelegt`,
    });
    return this.get(type.id);
  }

  async update(
    id: string,
    dto: UpdateCertificateTypeDto,
    actor: AuthUser,
  ): Promise<CertificateTypeView> {
    const type = await this.get(id);
    const before = snapshot(type);
    this.types.merge(type, dto);
    await this.types.save(type);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'certificate_type',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(type),
      summary: `hat Zertifikatstyp «${type.name}» geändert`,
    });
    return this.get(id);
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    const type = await this.get(id);
    await this.types.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'certificate_type',
      entityId: id,
      action: 'delete',
      before: snapshot(type),
      summary: `hat Zertifikatstyp «${type.name}» gelöscht`,
    });
  }

  /** Replaces the set of course types counting towards the maintenance rule. */
  async replaceMaintenanceCourseTypes(
    id: string,
    courseTypeIds: string[],
    actor: AuthUser,
  ): Promise<CertificateTypeView> {
    const type = await this.get(id);
    const ids = [...new Set(courseTypeIds)];
    const found = ids.length
      ? await this.courseTypes.findBy({ id: In(ids) })
      : [];
    if (found.length !== ids.length) {
      throw new BadRequestException('Unbekannter Kurstyp.');
    }
    await this.ds.transaction(async (em) => {
      await em.delete(CertificateTypeMaintenanceCourseType, {
        certificateTypeId: id,
      });
      if (ids.length) {
        await em.insert(
          CertificateTypeMaintenanceCourseType,
          ids.map((courseTypeId) => ({ certificateTypeId: id, courseTypeId })),
        );
      }
    });
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'certificate_type',
      entityId: id,
      action: 'replace_maintenance_course_types',
      before: { courseTypeIds: type.maintenanceCourseTypes.map((c) => c.id) },
      after: { courseTypeIds: ids },
      summary: `hat die Qualifikationspflege von «${type.name}» auf ${found.map((c) => c.code).join(', ') || 'keine Kurstypen'} gesetzt`,
    });
    return this.get(id);
  }

  private withMaintenance(
    type: CertificateType,
    links: CertificateTypeMaintenanceCourseType[],
  ): CertificateTypeView {
    const maintenanceCourseTypes = links
      .filter((l) => l.certificateTypeId === type.id)
      .map((l) => ({
        id: l.courseType.id,
        code: l.courseType.code,
        name: l.courseType.name,
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
    return Object.assign(type, { maintenanceCourseTypes });
  }
}
