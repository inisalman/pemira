import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const organizations = [
  'BEM',
  'MPM',
  'Himpunan Mahasiswa Keperawatan',
  'Himpunan Mahasiswa Kebidanan',
  'Himpunan Mahasiswa Ortotik Prostetik',
  'Himpunan Mahasiswa Kesehatan Gigi',
];

async function main() {
  console.log('Seeding database...');

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is required for seeding');
  }

  // Create 6 organizations using upsert (idempotent)
  for (const name of organizations) {
    await prisma.organization.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`  Organization: ${name}`);
  }

  // Create default admin account
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { nim: 'admin' },
    update: {},
    create: {
      nim: 'admin',
      password: hashedPassword,
      name: 'Administrator',
      role: 'ADMIN',
    },
  });
  console.log('  Admin account: admin / [configured ADMIN_PASSWORD]');

  console.log('Seeding complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
