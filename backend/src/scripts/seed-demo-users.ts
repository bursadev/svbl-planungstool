import 'dotenv/config';
import { createClerkClient } from '@clerk/backend';
import { UserRole } from '../database/enums.js';

/**
 * Creates the demo accounts in the Clerk *development* instance: one planner
 * and one instructor, so both views of the web app can be shown. Re-running
 * is safe: existing accounts get name, role and password updated.
 *
 * Accounts created through the Backend API have their e-mail marked as
 * verified, so sign-in only needs the password from DEMO_USER_PASSWORD in
 * `.env`. Nobody reads these mailboxes: switch off Clerk's new-device check
 * («Client trust» under Attack protection) in the dashboard, or a demo sign-in
 * from a new browser waits for a code that never arrives.
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
    email: 'planung@svbl.ch',
    firstName: 'Claudia',
    lastName: 'Meier',
    role: UserRole.Planner,
  },
  {
    // Same name as a seeded instructor, so "Mein Bereich" can be linked later.
    email: 'ausbildner@svbl.ch',
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
    // Demo accounts may use a simple password; skip the strength/breach check.
    const fields = {
      firstName: demo.firstName,
      lastName: demo.lastName,
      password,
      skipPasswordChecks: true,
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
    const verified = user.emailAddresses.find(
      (e) => e.emailAddress === demo.email,
    )?.verification?.status;
    console.log(
      `${existing ? 'updated' : 'created'} ${demo.email} (${demo.role}, e-mail ${verified ?? 'unverified'}) → ${user.id}`,
    );
  }
}

main().catch((err: unknown) => {
  // Clerk's API errors carry the real reason in `errors`, not in `message`.
  const details =
    err !== null && typeof err === 'object' && 'errors' in err
      ? (err.errors as { longMessage?: string; message: string }[])
          .map((e) => e.longMessage ?? e.message)
          .join('; ')
      : null;
  console.error(details ?? (err instanceof Error ? err.message : err));
  process.exitCode = 1;
});
