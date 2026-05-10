import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { importFromCsv } from '@/services/import.service';
import { log as auditLog } from '@/services/audit.service';

/**
 * POST /api/import
 * Accepts multipart form data with a CSV file upload.
 * Requires admin authentication.
 * Returns ImportResult as JSON.
 */
export async function POST(request: Request) {
  // Require admin authentication
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv')) {
      return Response.json(
        { error: 'Only CSV files are supported' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    if (!content.trim()) {
      return Response.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    // Process the import
    const result = await importFromCsv(content);

    // Log audit entry for bulk import
    await auditLog({
      actorId: session.user.id,
      actionType: 'BULK_IMPORT',
      details: `Bulk import from file ${file.name}: ${result.successCount} successful, ${result.failedRows.length} failed out of ${result.totalRows} rows`,
      metadata: {
        fileName: file.name,
        totalRows: result.totalRows,
        successCount: result.successCount,
        failedCount: result.failedRows.length,
      },
    });

    return Response.json(result);
  } catch {
    return Response.json(
      { error: 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}
