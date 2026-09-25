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
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3030',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3030',
    'http://192.168.100.14:3030',
    'http://192.168.100.14:3000',
    'http://192.168.100.230:3000',
    'http://192.168.100.230:3030',
    process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ].filter(Boolean),
});
