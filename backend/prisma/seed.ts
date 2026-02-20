/**
 * Seed – DocuTrust Vault
 * Creates demo company and admin user
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      companyName: 'DocuTrust Demo Corp',
      status: 'ACTIVE',
      retentionPolicyDays: 2555,
      legalJurisdiction: 'US Federal',
    },
  });

  const passwordHash = await bcrypt.hash('Admin123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@doctrust.local' },
    update: {},
    create: {
      email: 'admin@doctrust.local',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      companyId: company.id,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@doctrust.local' },
    update: {},
    create: {
      email: 'user@doctrust.local',
      firstName: 'Regular',
      lastName: 'User',
      passwordHash: await bcrypt.hash('User123!', 10),
      role: 'USER',
      status: 'ACTIVE',
      companyId: company.id,
    },
  });

  console.log('Seeded:', { company: company.companyName, admin: admin.email, user: user.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
