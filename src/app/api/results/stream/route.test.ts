import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock getServerSession
const mockGetServerSession = vi.hoisted(() => vi.fn());
vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}));

// Mock vote service
const mockGetAllVoteCounts = vi.hoisted(() => vi.fn());
vi.mock('@/services/vote.service', () => ({
  getAllVoteCounts: mockGetAllVoteCounts,
}));

// Mock auth options
vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

import { GET } from './route';

describe('GET /api/results/stream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new Request('http://localhost/api/results/stream');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 401 when user is not an admin', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', role: 'VOTER', nim: '12345', name: 'Test' },
    });

    const request = new Request('http://localhost/api/results/stream');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should return SSE stream with correct headers for admin users', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN', nim: '00001', name: 'Admin' },
    });
    mockGetAllVoteCounts.mockResolvedValue([
      {
        orgId: 'org-1',
        orgName: 'BEM',
        totalEligible: 50,
        totalVoted: 10,
        candidates: [
          { candidateId: 'cand-1', candidateName: 'Alice & Bob', count: 10 },
        ],
      },
    ]);

    const controller = new AbortController();
    const request = new Request('http://localhost/api/results/stream', {
      signal: controller.signal,
    });
    const response = await GET(request);

    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
    expect(response.headers.get('Connection')).toBe('keep-alive');

    // Read the first chunk from the stream
    const reader = response.body!.getReader();
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);

    expect(text).toContain('data: ');
    expect(text).toContain('"orgId":"org-1"');
    expect(text).toContain('"orgName":"BEM"');
    expect(text).toContain('\n\n');

    // Abort to clean up
    controller.abort();
  });

  it('should send error event when database query fails', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN', nim: '00001', name: 'Admin' },
    });
    mockGetAllVoteCounts.mockRejectedValue(new Error('DB connection lost'));

    const controller = new AbortController();
    const request = new Request('http://localhost/api/results/stream', {
      signal: controller.signal,
    });
    const response = await GET(request);

    const reader = response.body!.getReader();
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);

    expect(text).toContain('event: error');
    expect(text).toContain('Failed to fetch vote counts');

    // Abort to clean up
    controller.abort();
  });
});
