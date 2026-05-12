import { prisma } from '@/lib/prisma';
import { OrganizationManagementClient } from './OrganizationManagementClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrganizationsPage() {
  const organizations = await prisma.organization.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      logo: true,
    },
  });

  return (
    <div>
      <div className="mb-6">
        <p className="badge badge-blue">Admin</p>
        <h2 className="mt-3 text-2xl font-extrabold text-[var(--primary)] sm:text-3xl">
          Manajemen Organisasi
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Kelola organisasi dan upload logo
        </p>
      </div>

      <OrganizationManagementClient organizations={organizations} />
    </div>
  );
}
