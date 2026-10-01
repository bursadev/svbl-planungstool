import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { AuditService, snapshot } from '../system/audit.service.js';
import type { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto.js';
import { Skill } from './skill.entity.js';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill) private readonly skills: Repository<Skill>,
    private readonly audit: AuditService,
  ) {}

  list(): Promise<Skill[]> {
    return this.skills.find({ order: { name: 'ASC' } });
  }

  async get(id: string): Promise<Skill> {
    const skill = await this.skills.findOneBy({ id });
    if (!skill) throw new NotFoundException('Skill nicht gefunden.');
    return skill;
  }

  async create(dto: CreateSkillDto, actor: AuthUser): Promise<Skill> {
    const skill = await this.skills.save(this.skills.create(dto));
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'skill',
      entityId: skill.id,
      action: 'create',
      after: snapshot(skill),
      summary: `hat Skill «${skill.name}» angelegt`,
    });
    return skill;
  }

  async update(
    id: string,
    dto: UpdateSkillDto,
    actor: AuthUser,
  ): Promise<Skill> {
    const skill = await this.get(id);
    const before = snapshot(skill);
    this.skills.merge(skill, dto);
    await this.skills.save(skill);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'skill',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(skill),
      summary: `hat Skill «${skill.name}» geändert`,
    });
    return skill;
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    const skill = await this.get(id);
    await this.skills.delete(id);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'skill',
      entityId: id,
      action: 'delete',
      before: snapshot(skill),
      summary: `hat Skill «${skill.name}» gelöscht`,
    });
  }
}
