import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { AuditService, snapshot } from '../system/audit.service.js';
import { Apprentice } from './apprentice.entity.js';
import type {
  CreateTrainerDto,
  CreateTrainingCompanyDto,
  UpdateTrainerDto,
  UpdateTrainingCompanyDto,
} from './dto/training-company.dto.js';
import { Trainer } from './trainer.entity.js';
import { TrainingCompany } from './training-company.entity.js';

export interface TrainerView {
  id: string;
  trainingCompanyId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  apprenticeCount: number;
}

export interface TrainerListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  trainingCompany: { id: string; name: string };
}

export interface TrainingCompanyRow {
  id: string;
  name: string;
  addressLine: string | null;
  postalCode: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  externalRef: string | null;
  trainerCount: number;
  apprenticeCount: number;
}

export interface TrainingCompanyView extends TrainingCompanyRow {
  trainers: TrainerView[];
}

/** Lehrbetriebe and their Berufsbildner; the apprentice import references both. */
@Injectable()
export class TrainingCompaniesService {
  constructor(
    @InjectRepository(TrainingCompany)
    private readonly companies: Repository<TrainingCompany>,
    @InjectRepository(Trainer)
    private readonly trainers: Repository<Trainer>,
    @InjectRepository(Apprentice)
    private readonly apprentices: Repository<Apprentice>,
    private readonly audit: AuditService,
  ) {}

  /** All companies; `q` matches name or city. */
  async list(q?: string): Promise<TrainingCompanyRow[]> {
    const where = q
      ? [{ name: ILike(`%${q}%`) }, { city: ILike(`%${q}%`) }]
      : undefined;
    const companies = await this.companies.find({
      where,
      order: { name: 'ASC' },
    });
    const counts = await this.counts();
    return companies.map((company) => this.toRow(company, counts));
  }

  async get(id: string): Promise<TrainingCompanyView> {
    const company = await this.load(id);
    const trainers = await this.trainers.find({
      where: { trainingCompanyId: id },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
    const counts = await this.counts(id);
    return {
      ...this.toRow(company, counts),
      trainers: trainers.map((trainer) => toTrainerView(trainer, counts)),
    };
  }

  async create(
    dto: CreateTrainingCompanyDto,
    actor: AuthUser,
  ): Promise<TrainingCompanyView> {
    const company = await this.companies.save(this.companies.create(dto));
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'training_company',
      entityId: company.id,
      action: 'create',
      after: snapshot(company),
      summary: `hat Lehrbetrieb «${company.name}» angelegt`,
    });
    return this.get(company.id);
  }

  async update(
    id: string,
    dto: UpdateTrainingCompanyDto,
    actor: AuthUser,
  ): Promise<TrainingCompanyView> {
    const company = await this.load(id);
    const before = snapshot(company);
    this.companies.merge(company, dto);
    await this.companies.save(company);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'training_company',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(company),
      summary: `hat Lehrbetrieb «${company.name}» geändert`,
    });
    return this.get(id);
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    const company = await this.load(id);
    await this.companies.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'training_company',
      entityId: id,
      action: 'delete',
      before: snapshot(company),
      summary: `hat Lehrbetrieb «${company.name}» gelöscht`,
    });
  }

  // --- Trainers -------------------------------------------------------------

  /** All trainers across companies; `q` matches the name. For pickers. */
  async listTrainers(q?: string): Promise<TrainerListItem[]> {
    const qb = this.trainers
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.trainingCompany', 'company')
      .orderBy('t.lastName', 'ASC')
      .addOrderBy('t.firstName', 'ASC');
    if (q) {
      qb.where('(t.firstName ILIKE :q OR t.lastName ILIKE :q)', {
        q: `%${q}%`,
      });
    }
    return (await qb.getMany()).map((trainer) => ({
      id: trainer.id,
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      email: trainer.email,
      phone: trainer.phone,
      trainingCompany: {
        id: trainer.trainingCompany.id,
        name: trainer.trainingCompany.name,
      },
    }));
  }

  async createTrainer(
    companyId: string,
    dto: CreateTrainerDto,
    actor: AuthUser,
  ): Promise<TrainerView> {
    const company = await this.load(companyId);
    const trainer = this.trainers.create(dto);
    trainer.trainingCompanyId = companyId;
    await this.trainers.save(trainer);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'trainer',
      entityId: trainer.id,
      action: 'create',
      after: snapshot(trainer),
      summary: `hat Berufsbildner «${trainer.firstName} ${trainer.lastName}» bei ${company.name} angelegt`,
    });
    return toTrainerView(trainer, await this.counts(companyId));
  }

  async updateTrainer(
    id: string,
    dto: UpdateTrainerDto,
    actor: AuthUser,
  ): Promise<TrainerView> {
    const trainer = await this.loadTrainer(id);
    const before = snapshot(trainer);
    this.trainers.merge(trainer, dto);
    await this.trainers.save(trainer);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'trainer',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(trainer),
      summary: `hat Berufsbildner «${trainer.firstName} ${trainer.lastName}» geändert`,
    });
    return toTrainerView(trainer, await this.counts(trainer.trainingCompanyId));
  }

  async removeTrainer(id: string, actor: AuthUser): Promise<void> {
    const trainer = await this.loadTrainer(id);
    await this.trainers.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'trainer',
      entityId: id,
      action: 'delete',
      before: snapshot(trainer),
      summary: `hat Berufsbildner «${trainer.firstName} ${trainer.lastName}» gelöscht`,
    });
  }

  // --- Helpers --------------------------------------------------------------

  private async load(id: string): Promise<TrainingCompany> {
    const company = await this.companies.findOneBy({ id });
    if (!company) throw new NotFoundException('Lehrbetrieb nicht gefunden.');
    return company;
  }

  private async loadTrainer(id: string): Promise<Trainer> {
    const trainer = await this.trainers.findOneBy({ id });
    if (!trainer) throw new NotFoundException('Berufsbildner nicht gefunden.');
    return trainer;
  }

  /** Trainers per company plus active apprentices per company and per trainer. */
  private async counts(companyId?: string): Promise<Counts> {
    const trainerQb = this.trainers
      .createQueryBuilder('t')
      .select('t.trainingCompanyId', 'companyId')
      .addSelect('COUNT(*)', 'n')
      .groupBy('t.trainingCompanyId');
    if (companyId) {
      trainerQb.where('t.trainingCompanyId = :companyId', { companyId });
    }
    const apprenticeQb = this.apprentices
      .createQueryBuilder('a')
      .select('a.trainingCompanyId', 'companyId')
      .addSelect('a.trainerId', 'trainerId')
      .addSelect('COUNT(*)', 'n')
      .where("a.status = 'active'")
      .andWhere('a.trainingCompanyId IS NOT NULL')
      .groupBy('a.trainingCompanyId')
      .addGroupBy('a.trainerId');
    if (companyId) {
      apprenticeQb.andWhere('a.trainingCompanyId = :companyId', { companyId });
    }
    const [trainerRows, apprenticeRows] = await Promise.all([
      trainerQb.getRawMany<{ companyId: string; n: string }>(),
      apprenticeQb.getRawMany<{
        companyId: string;
        trainerId: string | null;
        n: string;
      }>(),
    ]);
    const counts: Counts = {
      trainersPerCompany: new Map(),
      apprenticesPerCompany: new Map(),
      apprenticesPerTrainer: new Map(),
    };
    for (const row of trainerRows) {
      counts.trainersPerCompany.set(row.companyId, Number(row.n));
    }
    for (const row of apprenticeRows) {
      counts.apprenticesPerCompany.set(
        row.companyId,
        (counts.apprenticesPerCompany.get(row.companyId) ?? 0) + Number(row.n),
      );
      if (row.trainerId) {
        counts.apprenticesPerTrainer.set(
          row.trainerId,
          (counts.apprenticesPerTrainer.get(row.trainerId) ?? 0) +
            Number(row.n),
        );
      }
    }
    return counts;
  }

  private toRow(company: TrainingCompany, counts: Counts): TrainingCompanyRow {
    return {
      id: company.id,
      name: company.name,
      addressLine: company.addressLine,
      postalCode: company.postalCode,
      city: company.city,
      email: company.email,
      phone: company.phone,
      externalRef: company.externalRef,
      trainerCount: counts.trainersPerCompany.get(company.id) ?? 0,
      apprenticeCount: counts.apprenticesPerCompany.get(company.id) ?? 0,
    };
  }
}

interface Counts {
  trainersPerCompany: Map<string, number>;
  apprenticesPerCompany: Map<string, number>;
  apprenticesPerTrainer: Map<string, number>;
}

function toTrainerView(trainer: Trainer, counts: Counts): TrainerView {
  return {
    id: trainer.id,
    trainingCompanyId: trainer.trainingCompanyId,
    firstName: trainer.firstName,
    lastName: trainer.lastName,
    email: trainer.email,
    phone: trainer.phone,
    apprenticeCount: counts.apprenticesPerTrainer.get(trainer.id) ?? 0,
  };
}
