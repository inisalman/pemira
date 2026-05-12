import { prisma } from '@/lib/prisma';
import { getSiteSetting } from '@/lib/site-settings';
import { OrganizationManagementClient } from './OrganizationManagementClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrganizationsPage() {
  const [organizations, siteLogo] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, logo: true },
    }),
    getSiteSetting('site_logo'),
  ]);

  return (
    <div>
      <div className="mb-6">
        <p className="badge badge-blue">Admin</p>
        <h2 className="mt-3 text-2xl font-extrabold text-[var(--primary)] sm:text-3xl">
          Manajemen Organisasi
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Kelola organisasi, upload logo organisasi, dan logo utama Pemira
        </p>
      </div>

      <OrganizationManagementClient organizations={organizations} siteLogo={siteLogo} />
    </div>
  );
}
