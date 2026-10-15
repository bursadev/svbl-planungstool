import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { Location } from '../locations/location.entity.js';
import { AuditService, snapshot } from '../system/audit.service.js';
import { Customer } from './customer.entity.js';
import type {
  CreateCustomerDto,
  UpdateCustomerDto,
} from './dto/customer.dto.js';
import type {
  CreateParticipantDto,
  UpdateParticipantDto,
} from './dto/participant.dto.js';
import { Participant } from './participant.entity.js';

export interface ParticipantView {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  language: Participant['language'];
  notes: string | null;
  customer: { id: string; name: string } | null;
}

export interface CustomerRow {
  id: string;
  name: string;
  addressLine: string | null;
  postalCode: string | null;
  city: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  externalRefAbacus: string | null;
  externalRefOdaorg: string | null;
  active: boolean;
  participantCount: number;
  siteCount: number;
}

export interface CustomerView extends CustomerRow {
  participants: ParticipantView[];
  /** Customer sites (locations with `kind = customer_site`) of this customer. */
  sites: Pick<Location, 'id' | 'code' | 'name' | 'city' | 'active'>[];
}

/** Kunden and their Teilnehmende; Abacus/OdAOrg stay the leading systems in the PoC. */
@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(Participant)
    private readonly participants: Repository<Participant>,
    @InjectRepository(Location)
    private readonly locations: Repository<Location>,
    private readonly audit: AuditService,
  ) {}

  /** All customers; `q` matches name or city. */
  async list(q?: string): Promise<CustomerRow[]> {
    const where = q
      ? [{ name: ILike(`%${q}%`) }, { city: ILike(`%${q}%`) }]
      : undefined;
    const customers = await this.customers.find({
      where,
      order: { name: 'ASC' },
    });
    const counts = await this.counts();
    return customers.map((customer) => toRow(customer, counts));
  }

  async get(id: string): Promise<CustomerView> {
    const customer = await this.load(id);
    const [participants, sites, counts] = await Promise.all([
      this.participants.find({
        where: { customerId: id },
        relations: { customer: true },
        order: { lastName: 'ASC', firstName: 'ASC' },
      }),
      this.locations.find({
        where: { customerId: id },
        order: { name: 'ASC' },
      }),
      this.counts(id),
    ]);
    return {
      ...toRow(customer, counts),
      participants: participants.map(toParticipantView),
      sites: sites.map((site) => ({
        id: site.id,
        code: site.code,
        name: site.name,
        city: site.city,
        active: site.active,
      })),
    };
  }

  async create(dto: CreateCustomerDto, actor: AuthUser): Promise<CustomerView> {
    const customer = await this.customers.save(this.customers.create(dto));
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'customer',
      entityId: customer.id,
      action: 'create',
      after: snapshot(customer),
      summary: `hat Kunde «${customer.name}» angelegt`,
    });
    return this.get(customer.id);
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
    actor: AuthUser,
  ): Promise<CustomerView> {
    const customer = await this.load(id);
    const before = snapshot(customer);
    this.customers.merge(customer, dto);
    await this.customers.save(customer);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'customer',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(customer),
      summary: `hat Kunde «${customer.name}» geändert`,
    });
    return this.get(id);
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    const customer = await this.load(id);
    await this.customers.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'customer',
      entityId: id,
      action: 'delete',
      before: snapshot(customer),
      summary: `hat Kunde «${customer.name}» gelöscht`,
    });
  }

  // --- Participants ---------------------------------------------------------

  /** All participants; `q` matches the name, `customerId` narrows to one customer. */
  async listParticipants(
    q?: string,
    customerId?: string,
  ): Promise<ParticipantView[]> {
    const qb = this.participants
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.customer', 'customer')
      .orderBy('p.lastName', 'ASC')
      .addOrderBy('p.firstName', 'ASC');
    if (q) {
      qb.andWhere('(p.firstName ILIKE :q OR p.lastName ILIKE :q)', {
        q: `%${q}%`,
      });
    }
    if (customerId) qb.andWhere('p.customerId = :customerId', { customerId });
    return (await qb.getMany()).map(toParticipantView);
  }

  async createParticipant(
    dto: CreateParticipantDto,
    actor: AuthUser,
  ): Promise<ParticipantView> {
    if (dto.customerId) await this.assertCustomer(dto.customerId);
    const participant = await this.participants.save(
      this.participants.create(dto),
    );
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'participant',
      entityId: participant.id,
      action: 'create',
      after: snapshot(participant),
      summary: `hat Teilnehmer/in «${participant.firstName} ${participant.lastName}» angelegt`,
    });
    return this.getParticipant(participant.id);
  }

  async updateParticipant(
    id: string,
    dto: UpdateParticipantDto,
    actor: AuthUser,
  ): Promise<ParticipantView> {
    // Loaded without the customer relation: a loaded relation would win over
    // a nulled `customerId` when TypeORM persists the row.
    const participant = await this.participants.findOneBy({ id });
    if (!participant) {
      throw new NotFoundException('Teilnehmer/in nicht gefunden.');
    }
    if (dto.customerId) await this.assertCustomer(dto.customerId);
    const before = snapshot(participant);
    this.participants.merge(participant, dto);
    await this.participants.save(participant);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'participant',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(participant),
      summary: `hat Teilnehmer/in «${participant.firstName} ${participant.lastName}» geändert`,
    });
    return this.getParticipant(id);
  }

  async removeParticipant(id: string, actor: AuthUser): Promise<void> {
    const participant = await this.loadParticipant(id);
    await this.participants.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'participant',
      entityId: id,
      action: 'delete',
      before: snapshot(participant),
      summary: `hat Teilnehmer/in «${participant.firstName} ${participant.lastName}» gelöscht`,
    });
  }

  // --- Helpers --------------------------------------------------------------

  private async load(id: string): Promise<Customer> {
    const customer = await this.customers.findOneBy({ id });
    if (!customer) throw new NotFoundException('Kunde nicht gefunden.');
    return customer;
  }

  private async assertCustomer(id: string): Promise<void> {
    if (!(await this.customers.existsBy({ id }))) {
      throw new BadRequestException('Unbekannter Kunde.');
    }
  }

  private async getParticipant(id: string): Promise<ParticipantView> {
    const participant = await this.loadParticipant(id);
    return toParticipantView(participant);
  }

  private async loadParticipant(id: string): Promise<Participant> {
    const participant = await this.participants.findOne({
      where: { id },
      relations: { customer: true },
    });
    if (!participant) {
      throw new NotFoundException('Teilnehmer/in nicht gefunden.');
    }
    return participant;
  }

  /** Participants and customer sites per customer. */
  private async counts(customerId?: string): Promise<Counts> {
    const participantQb = this.participants
      .createQueryBuilder('p')
      .select('p.customerId', 'customerId')
      .addSelect('COUNT(*)', 'n')
      .where('p.customerId IS NOT NULL')
      .groupBy('p.customerId');
    const siteQb = this.locations
      .createQueryBuilder('l')
      .select('l.customerId', 'customerId')
      .addSelect('COUNT(*)', 'n')
      .where('l.customerId IS NOT NULL')
      .groupBy('l.customerId');
    if (customerId) {
      participantQb.andWhere('p.customerId = :customerId', { customerId });
      siteQb.andWhere('l.customerId = :customerId', { customerId });
    }
    const [participantRows, siteRows] = await Promise.all([
      participantQb.getRawMany<{ customerId: string; n: string }>(),
      siteQb.getRawMany<{ customerId: string; n: string }>(),
    ]);
    return {
      participants: new Map(
        participantRows.map((row) => [row.customerId, Number(row.n)]),
      ),
      sites: new Map(siteRows.map((row) => [row.customerId, Number(row.n)])),
    };
  }
}

interface Counts {
  participants: Map<string, number>;
  sites: Map<string, number>;
}

function toRow(customer: Customer, counts: Counts): CustomerRow {
  return {
    id: customer.id,
    name: customer.name,
    addressLine: customer.addressLine,
    postalCode: customer.postalCode,
    city: customer.city,
    contactName: customer.contactName,
    contactEmail: customer.contactEmail,
    contactPhone: customer.contactPhone,
    externalRefAbacus: customer.externalRefAbacus,
    externalRefOdaorg: customer.externalRefOdaorg,
    active: customer.active,
    participantCount: counts.participants.get(customer.id) ?? 0,
    siteCount: counts.sites.get(customer.id) ?? 0,
  };
}

function toParticipantView(participant: Participant): ParticipantView {
  return {
    id: participant.id,
    firstName: participant.firstName,
    lastName: participant.lastName,
    email: participant.email,
    phone: participant.phone,
    language: participant.language,
    notes: participant.notes,
    customer: participant.customer
      ? { id: participant.customer.id, name: participant.customer.name }
      : null,
  };
}
