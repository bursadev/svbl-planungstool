import 'dotenv/config';
import { createClerkClient } from '@clerk/backend';
import { UserRole } from '../database/enums.js';

/**
 * Creates the demo accounts in the Clerk *development* instance: one planner
 * and one instructor, so both views of the web app can be shown. Re-running
 * is safe: existing accounts get name, role and password updated.
 *
 * The `+clerk_test` addresses are Clerk test e-mails: nothing is ever sent to
 * them and every verification code is `424242`, so new-device verification
 * can't block a demo. The password comes from DEMO_USER_PASSWORD in `.env`.
 *
 *   pnpm seed:users
 */
interface DemoUser {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

const DEMO_USERS: DemoUser[] = [
  {
    email: 'planung+clerk_test@svbl.ch',
    firstName: 'Claudia',
    lastName: 'Meier',
    role: UserRole.Planner,
  },
  {
    // Same person as the seeded instructor, so "Mein Bereich" can be linked later.
    email: 'roger.federer+clerk_test@svbl.ch',
    firstName: 'Roger',
    lastName: 'Federer',
    role: UserRole.Instructor,
  },
];

async function main(): Promise<void> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error('CLERK_SECRET_KEY is not set.');
  if (!secretKey.startsWith('sk_test_')) {
    throw new Error(
      'Demo accounts are only created in a development instance (sk_test_…).',
    );
  }
  const password = process.env.DEMO_USER_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error('DEMO_USER_PASSWORD (at least 8 characters) is not set.');
  }

  const clerk = createClerkClient({ secretKey });
  for (const demo of DEMO_USERS) {
    const { data } = await clerk.users.getUserList({
      emailAddress: [demo.email],
    });
    const existing = data[0];
    const fields = {
      firstName: demo.firstName,
      lastName: demo.lastName,
      password,
    };
    let user;
    if (existing) {
      await clerk.users.updateUser(existing.id, fields);
      user = await clerk.users.updateUserMetadata(existing.id, {
        publicMetadata: { role: demo.role },
      });
    } else {
      user = await clerk.users.createUser({
        emailAddress: [demo.email],
        publicMetadata: { role: demo.role },
        ...fields,
      });
    }
    console.log(
      `${existing ? 'updated' : 'created'} ${demo.email} (${demo.role}) → ${user.id}`,
    );
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
