import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins/organization';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

import * as schema from '../database/schema';

// better-auth needs its own db handle — it's configured as a plain module-level
// singleton (not part of the Nest DI graph), same pattern as the Nest DRIZZLE
// provider, just a second client pointed at the same DATABASE_URL.
const db = drizzle(process.env.DATABASE_URL!, { schema });

const isProduction = process.env.NODE_ENV === 'production';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.CORS_ORIGIN ?? 'http://localhost:3000'],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
  // Env-gated cookie config: SameSite=None + Secure only in production, since Secure
  // cookies are rejected by browsers over plain http:// in local dev. Cross-origin
  // (apps/web on a different port/origin than this backend) requires SameSite=None
  // in production; Lax is fine in dev since browsers still send it for top-level
  // navigations and same-site-ish localhost requests during local testing.
  advanced: {
    useSecureCookies: isProduction,
    defaultCookieAttributes: {
      sameSite: isProduction ? 'none' : 'lax',
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const [firstMembership] = await db
            .select({ organizationId: schema.member.organizationId })
            .from(schema.member)
            .where(eq(schema.member.userId, session.userId))
            .orderBy(schema.member.createdAt)
            .limit(1);

          if (!firstMembership) return;

          return {
            data: {
              ...session,
              activeOrganizationId: firstMembership.organizationId,
            },
          };
        },
      },
    },
  },
  plugins: [organization({ creatorRole: 'owner' })],
});
