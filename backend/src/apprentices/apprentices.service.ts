import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { WRITE_ROLES } from '../auth/roles.decorator.js';
import { Apprentice } from './apprentice.entity.js';
import type { ListApprenticesQuery } from './dto/apprentice.dto.js';

export interface ApprenticeRow {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  track: Apprentice['track'];
  language: Apprentice['language'];
  status: Apprentice['status'];
  cohort: { id: string; label: string };
  vocationalSchool: { id: string; shortName: string; name: string };
  schoolClass: { id: string; code: string } | null;
  trainingCompany: { id: string; name: string } | null;
}

export interface ApprenticeDetail extends ApprenticeRow {
  /** Only for planners and admins; null for other roles. */
  ahvNumber: string | null;
  externalId: string | null;
  gender: Apprentice['gender'];
  email: string | null;
  phone: string | null;
  addressLine: string | null;
  postalCode: string | null;
  city: string | null;
  nativeLanguage: string | null;
  professionCode: string | null;
  apprenticeshipStart: string | null;
  apprenticeshipEnd: string | null;
  hasBm1: boolean;
  trainer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  } | null;
  importBatchId: string | null;
  importedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Read-only: the school export is the source of truth (Requirements §7). */
@Injectable()
export class ApprenticesService {
  constructor(
    @InjectRepository(Apprentice)
    private readonly apprentices: Repository<Apprentice>,
  ) {}

  async list(query: ListApprenticesQuery): Promise<ApprenticeRow[]> {
    const qb = this.apprentices
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.cohort', 'cohort')
      .leftJoinAndSelect('a.vocationalSchool', 'school')
      .leftJoinAndSelect('a.schoolClass', 'cls')
      .leftJoinAndSelect('a.trainingCompany', 'company')
      .orderBy('a.lastName', 'ASC')
      .addOrderBy('a.firstName', 'ASC');
    const q = query.q?.trim();
    if (q) {
      qb.andWhere('(a.firstName ILIKE :q OR a.lastName ILIKE :q)', {
        q: `%${q}%`,
      });
    }
    if (query.vocationalSchoolId) {
      qb.andWhere('a.vocationalSchoolId = :schoolId', {
        schoolId: query.vocationalSchoolId,
      });
    }
    if (query.cohortId)
      qb.andWhere('a.cohortId = :cohortId', { cohortId: query.cohortId });
    if (query.track) qb.andWhere('a.track = :track', { track: query.track });
    return (await qb.getMany()).map(toRow);
  }

  async get(id: string, actor: AuthUser): Promise<ApprenticeDetail> {
    const a = await this.apprentices.findOne({
      where: { id },
      relations: {
        cohort: true,
        vocationalSchool: true,
        schoolClass: true,
        trainingCompany: true,
        trainer: true,
      },
    });
    if (!a) throw new NotFoundException('Lernende/r nicht gefunden.');
    return {
      ...toRow(a),
      ahvNumber: WRITE_ROLES.includes(actor.role) ? a.ahvNumber : null,
      externalId: a.externalId,
      gender: a.gender,
      email: a.email,
      phone: a.phone,
      addressLine: a.addressLine,
      postalCode: a.postalCode,
      city: a.city,
      nativeLanguage: a.nativeLanguage,
      professionCode: a.professionCode,
      apprenticeshipStart: a.apprenticeshipStart,
      apprenticeshipEnd: a.apprenticeshipEnd,
      hasBm1: a.hasBm1,
      trainer: a.trainer
        ? {
            id: a.trainer.id,
            firstName: a.trainer.firstName,
            lastName: a.trainer.lastName,
            email: a.trainer.email,
            phone: a.trainer.phone,
          }
        : null,
      importBatchId: a.importBatchId,
      importedAt: a.importedAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }
}

function toRow(a: Apprentice): ApprenticeRow {
  return {
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    birthDate: a.birthDate,
    track: a.track,
    language: a.language,
    status: a.status,
    cohort: { id: a.cohort.id, label: a.cohort.label },
    vocationalSchool: {
      id: a.vocationalSchool.id,
      shortName: a.vocationalSchool.shortName,
      name: a.vocationalSchool.name,
    },
    schoolClass: a.schoolClass
      ? { id: a.schoolClass.id, code: a.schoolClass.code }
      : null,
    trainingCompany: a.trainingCompany
      ? { id: a.trainingCompany.id, name: a.trainingCompany.name }
      : null,
  };
}
