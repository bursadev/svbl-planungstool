import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trainer } from '../apprentices/trainer.entity.js';
import type { AuthUser } from '../auth/clerk-auth.guard.js';
import { UserStatus, type UserRole } from '../database/enums.js';
import { Instructor } from '../instructors/instructor.entity.js';
import { AuditService, snapshot } from '../system/audit.service.js';
import type { UpdateUserDto } from './dto/user.dto.js';
import { User } from './user.entity.js';

export interface UserView {
  id: string;
  email: string;
  displayName: string;
  role: User['role'];
  locale: User['locale'];
  status: User['status'];
  lastLoginAt: Date | null;
  instructor: { id: string; firstName: string; lastName: string } | null;
  trainer: { id: string; firstName: string; lastName: string } | null;
}

/** What the auth layer knows about the signed-in person. */
export interface UserProfile {
  userId: string;
  role: UserRole;
  email: string;
  displayName: string | null;
}

/** How long a user row is trusted before it is refreshed from the token again. */
const TOUCH_INTERVAL_MS = 10 * 60_000;

/**
 * Mirrors Clerk accounts into the `user` table (ADR-0003): the row carries
 * the links to instructor/trainer and is what audit entries point to.
 */
@Injectable()
export class UsersService {
  private readonly touched = new Map<
    string,
    { at: number; dbUserId: string }
  >();

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Instructor)
    private readonly instructors: Repository<Instructor>,
    @InjectRepository(Trainer)
    private readonly trainers: Repository<Trainer>,
    private readonly audit: AuditService,
  ) {}

  /**
   * Upserts the row for a signed-in user, at most once per interval, and
   * returns its internal id.
   */
  async touch(profile: UserProfile): Promise<string> {
    const cached = this.touched.get(profile.userId);
    if (cached && Date.now() - cached.at < TOUCH_INTERVAL_MS) {
      return cached.dbUserId;
    }

    // One statement (INSERT … ON CONFLICT), so two concurrent first requests
    // of the same user can't race each other into a unique violation.
    await this.users.upsert(
      {
        clerkUserId: profile.userId,
        email: profile.email,
        displayName: profile.displayName ?? profile.email,
        role: profile.role,
        lastLoginAt: new Date(),
      },
      { conflictPaths: ['clerkUserId'], skipUpdateIfNoValuesChanged: false },
    );
    const user = await this.users.findOneByOrFail({
      clerkUserId: profile.userId,
    });
    // Deactivated accounts stay signed in at Clerk but are shut out here;
    // never cached, so re-activation takes effect on the next request.
    if (user.status === UserStatus.Disabled) {
      throw new ForbiddenException('Konto deaktiviert.');
    }

    this.touched.set(profile.userId, { at: Date.now(), dbUserId: user.id });
    return user.id;
  }

  findByClerkId(clerkUserId: string): Promise<User | null> {
    return this.users.findOne({ where: { clerkUserId } });
  }

  async list(): Promise<UserView[]> {
    const users = await this.users.find({
      relations: { instructor: true, trainer: true },
      order: { displayName: 'ASC' },
    });
    return users.map(toView);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actor: AuthUser,
  ): Promise<UserView> {
    // Loaded without relations: a loaded relation would win over a nulled
    // link column when TypeORM persists the row.
    const user = await this.users.findOneBy({ id });
    if (!user) throw new NotFoundException('Benutzer nicht gefunden.');
    if (dto.instructorId && !(await this.instructors.existsBy({ id: dto.instructorId }))) {
      throw new BadRequestException('Unbekannter Ausbilder.');
    }
    if (dto.trainerId && !(await this.trainers.existsBy({ id: dto.trainerId }))) {
      throw new BadRequestException('Unbekannter Berufsbildner.');
    }
    const before = snapshot(user);
    if (dto.status !== undefined) user.status = dto.status;
    if (dto.instructorId !== undefined) user.instructorId = dto.instructorId;
    if (dto.trainerId !== undefined) user.trainerId = dto.trainerId;
    await this.users.save(user);
    await this.audit.record({
      actorUserId: actor.dbUserId,
      entityType: 'user',
      entityId: id,
      action: 'update',
      before,
      after: snapshot(user),
      summary: `hat Benutzer «${user.displayName}» geändert`,
    });
    // The cached touch entry may now carry a stale status; drop it.
    this.touched.delete(user.clerkUserId);
    const fresh = await this.users.findOneOrFail({
      where: { id },
      relations: { instructor: true, trainer: true },
    });
    return toView(fresh);
  }
}

function toView(user: User): UserView {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    locale: user.locale,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    instructor: user.instructor
      ? {
          id: user.instructor.id,
          firstName: user.instructor.firstName,
          lastName: user.instructor.lastName,
        }
      : null,
    trainer: user.trainer
      ? {
          id: user.trainer.id,
          firstName: user.trainer.firstName,
          lastName: user.trainer.lastName,
        }
      : null,
  };
}
