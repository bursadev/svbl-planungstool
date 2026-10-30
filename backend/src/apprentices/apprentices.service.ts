import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { WRITE_ROLES } from '../auth/roles.decorator.js';
import {
  applyArchive,
  applySearch,
  pageOf,
  type Page,
} from '../common/list-query.js';
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

  /**
   * Lernende as list rows, filtered and (with `page`) paged; the total goes
   * into `X-Total-Count`. See `query` for the filters.
   */
  async list(query: ListApprenticesQuery = {}): Promise<Page<ApprenticeRow>> {
    const page = await this.query(query);
    return { total: page.total, items: page.items.map(toRow) };
  }

  /**
   * The matching Lernende with their relations, unpaged unless `page` is set:
   * the rows of the CSV export. `q` matches first and last name, external
   * id, e-mail, training company and class, word by word and ignoring
   * accents. Active = status `active`; archived = finished or dropped.
   */
  async query(query: ListApprenticesQuery = {}): Promise<Page<Apprentice>> {
    const qb = this.apprentices
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.cohort', 'cohort')
      .leftJoinAndSelect('a.vocationalSchool', 'school')
      .leftJoinAndSelect('a.schoolClass', 'cls')
      .leftJoinAndSelect('a.trainingCompany', 'company')
      // Last name, then first name, as one sort key for `pageOf`.
      .addSelect("concat(a.lastName, ' ', a.firstName)", 'name_sort');
    applySearch(
      qb,
      [
        'a.firstName',
        'a.lastName',
        'a.externalId',
        'a.email',
        'company.name',
        'cls.code',
      ],
      query.q,
    );
    applyArchive(qb, query.archive, "a.status = 'active'");
    if (query.vocationalSchoolId) {
      qb.andWhere('a.vocationalSchoolId = :schoolId', {
        schoolId: query.vocationalSchoolId,
      });
    }
    if (query.cohortId)
      qb.andWhere('a.cohortId = :cohortId', { cohortId: query.cohortId });
    if (query.trainingCompanyId) {
      qb.andWhere('a.trainingCompanyId = :trainingCompanyId', {
        trainingCompanyId: query.trainingCompanyId,
      });
    }
    if (query.track) qb.andWhere('a.track = :track', { track: query.track });
    if (query.language) {
      qb.andWhere('a.language = :language', { language: query.language });
    }
    return pageOf(
      qb,
      query,
      {
        name: 'name_sort',
        school: 'school.shortName',
        cohort: 'cohort.label',
        company: 'company.name',
      },
      'name',
      'a.id',
    );
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
