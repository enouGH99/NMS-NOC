import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'petugas',
      },
      phone: {
        type: 'string',
        required: false,
      },
      status: {
        type: 'string',
        required: false,
        defaultValue: 'active',
      },
      lastLogin: {
        type: 'date',
        required: false,
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET || 'nms-noc-production-super-secret-key-32chars-length-min',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
});
