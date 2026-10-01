import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { UserRole } from '../database/enums.js';
import { User } from './user.entity.js';

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

    this.touched.set(profile.userId, { at: Date.now(), dbUserId: user.id });
    return user.id;
  }

  findByClerkId(clerkUserId: string): Promise<User | null> {
    return this.users.findOne({ where: { clerkUserId } });
  }
}
