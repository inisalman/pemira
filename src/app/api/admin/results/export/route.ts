import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateVoterHash } from '@/lib/hash';
import { prisma } from '@/lib/prisma';
import { getAllVoteCounts } from '@/services/vote.service';

type CellValue = string | number;
type Sheet = {
  name: string;
  rows: CellValue[][];
};

function csvValue(value: CellValue) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows: CellValue[][]) {
  return rows.map((row) => row.map(csvValue).join(',')).join('\n');
}

function xmlValue(value: CellValue) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeWorksheet(sheet: Sheet) {
  const rows = sheet.rows
    .map((row, rowIndex) => {
      const styleId = rowIndex === 0 ? 'Header' : 'Default';
      const cells = row
        .map((value) => {
          const type = typeof value === 'number' ? 'Number' : 'String';
          return `<Cell ss:StyleID="${styleId}"><Data ss:Type="${type}">${xmlValue(value)}</Data></Cell>`;
        })
        .join('');

      return `<Row>${cells}</Row>`;
    })
    .join('');

  return `
    <Worksheet ss:Name="${xmlValue(sheet.name)}">
      <Table>${rows}</Table>
      <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
        <FreezePanes/>
        <FrozenNoSplit/>
        <SplitHorizontal>1</SplitHorizontal>
        <TopRowBottomPane>1</TopRowBottomPane>
      </WorksheetOptions>
    </Worksheet>`;
}

function toExcelXml(sheets: Sheet[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook
  xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default">
      <Alignment ss:Vertical="Top"/>
      <Font ss:FontName="Arial" ss:Size="10"/>
    </Style>
    <Style ss:ID="Header">
      <Alignment ss:Vertical="Top"/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1"/>
      <Interior ss:Color="#DFF5EF" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
  </Styles>
  ${sheets.map(makeWorksheet).join('')}
</Workbook>`;
}

async function getVoterParticipationRows(organizationIds: string[]) {
  const accessRows = await prisma.voterAccess.findMany({
    where: { organizationId: { in: organizationIds } },
    include: {
      organization: { select: { id: true, name: true } },
      user: { select: { id: true, nim: true, name: true, department: true } },
    },
    orderBy: [{ organizationId: 'asc' }, { createdAt: 'asc' }],
  });

  const rowsWithHashes = accessRows.map((access) => ({
    access,
    hash: generateVoterHash(access.userId, access.organizationId),
  }));

  const voteMap = new Map<string, Date>();
  const chunkSize = 1000;
  for (let i = 0; i < rowsWithHashes.length; i += chunkSize) {
    const chunk = rowsWithHashes.slice(i, i + chunkSize);
    const votes = await prisma.vote.findMany({
      where: {
        encryptedVoterHash: { in: chunk.map((row) => row.hash) },
      },
      select: {
        encryptedVoterHash: true,
        createdAt: true,
      },
    });

    for (const vote of votes) {
      voteMap.set(vote.encryptedVoterHash, vote.createdAt);
    }
  }

  return rowsWithHashes
    .map(({ access, hash }) => {
      const votedAt = voteMap.get(hash);
      return [
        access.organization.name,
        access.user.nim,
        access.user.name,
        access.user.department || '',
        votedAt ? 'Sudah memilih' : 'Belum memilih',
        votedAt ? votedAt.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '',
      ];
    })
    .sort((a, b) => `${a[0]} ${a[2]}`.localeCompare(`${b[0]} ${b[2]}`));
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const organizationId = url.searchParams.get('organizationId');
  const format = url.searchParams.get('format') ?? 'xls';
  const allResults = await getAllVoteCounts();
  const results = organizationId
    ? allResults.filter((org) => org.orgId === organizationId)
    : allResults;

  if (organizationId && results.length === 0) {
    return Response.json({ error: 'Organisasi tidak ditemukan' }, { status: 404 });
  }

  const summaryRows: CellValue[][] = [
    ['Organisasi', 'Pemilih Terdaftar', 'Suara Masuk', 'Belum Memilih', 'Partisipasi (%)'],
  ];
  const candidateRows: CellValue[][] = [
    ['Organisasi', 'Kandidat', 'Suara', 'Persentase dari Suara Masuk (%)'],
  ];
  const flatRows: CellValue[][] = [
    [
      'organization_name',
      'total_eligible',
      'total_voted',
      'not_voted',
      'participation_percent',
      'candidate_name',
      'candidate_votes',
      'candidate_vote_percent',
    ],
  ];

  for (const org of results) {
    const notVoted = Math.max(org.totalEligible - org.totalVoted, 0);
    const participation =
      org.totalEligible > 0 ? (org.totalVoted / org.totalEligible) * 100 : 0;

    summaryRows.push([
      org.orgName,
      org.totalEligible,
      org.totalVoted,
      notVoted,
      Number(participation.toFixed(2)),
    ]);

    if (org.candidates.length === 0) {
      candidateRows.push([org.orgName, 'Belum ada kandidat', 0, 0]);
      flatRows.push([
        org.orgName,
        org.totalEligible,
        org.totalVoted,
        notVoted,
        Number(participation.toFixed(2)),
        'Belum ada kandidat',
        0,
        0,
      ]);
      continue;
    }

    for (const candidate of org.candidates) {
      const candidateVotePercent =
        org.totalVoted > 0 ? (candidate.count / org.totalVoted) * 100 : 0;

      candidateRows.push([
        org.orgName,
        candidate.candidateName,
        candidate.count,
        Number(candidateVotePercent.toFixed(2)),
      ]);
      flatRows.push([
        org.orgName,
        org.totalEligible,
        org.totalVoted,
        notVoted,
        Number(participation.toFixed(2)),
        candidate.candidateName,
        candidate.count,
        Number(candidateVotePercent.toFixed(2)),
      ]);
    }
  }

  if (format === 'csv') {
    const csvFilename = organizationId
      ? `hasil-suara-${safeFilename(results[0].orgName)}.csv`
      : 'hasil-suara-semua-organisasi.csv';

    return new Response(toCsv(flatRows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${csvFilename}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  const voterRows = await getVoterParticipationRows(results.map((org) => org.orgId));
  const sheets: Sheet[] = [
    { name: 'Ringkasan', rows: summaryRows },
    { name: 'Perolehan Kandidat', rows: candidateRows },
    {
      name: 'Partisipasi Pemilih',
      rows: [
        ['Organisasi', 'NIM/NIP/Username', 'Nama Pemilih', 'Jurusan', 'Status', 'Waktu Memilih'],
        ...voterRows,
      ],
    },
  ];

  const filename = organizationId
    ? `hasil-suara-${safeFilename(results[0].orgName)}.xls`
    : 'hasil-suara-semua-organisasi.xls';

  return new Response(toExcelXml(sheets), {
    headers: {
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
