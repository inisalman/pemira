import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

import { getToken } from 'next-auth/jwt';
import { proxy } from './proxy';

const mockedGetToken = vi.mocked(getToken);

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('Route protection proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Public routes', () => {
    it('allows access to / without authentication', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createRequest('/');
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('x-middleware-next')).toBe('1');
    });

    it('allows access to /login without authentication', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createRequest('/login');
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('x-middleware-next')).toBe('1');
    });

    it('allows access to /api/auth routes without authentication', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createRequest('/api/auth/signin');
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('x-middleware-next')).toBe('1');
    });

    it('allows access to /api/auth/callback/credentials without authentication', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createRequest('/api/auth/callback/credentials');
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('x-middleware-next')).toBe('1');
    });
  });

  describe('Unauthenticated access to protected routes', () => {
    it('redirects unauthenticated users from /dashboard to /login', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createRequest('/dashboard');
      const response = await proxy(request);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/login'
      );
    });

    it('redirects unauthenticated users from /dashboard/vote/123 to /login', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createRequest('/dashboard/vote/123');
      const response = await proxy(request);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/login'
      );
    });

    it('redirects unauthenticated users from /admin to /login', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createRequest('/admin');
      const response = await proxy(request);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/login'
      );
    });

    it('redirects unauthenticated users from /admin/users to /login', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createRequest('/admin/users');
      const response = await proxy(request);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/login'
      );
    });
  });

  describe('VOTER role access', () => {
    const voterToken = {
      role: 'VOTER',
      nim: '1234567890',
      sub: 'user-1',
      name: 'Test Voter',
    };

    it('allows VOTER to access /dashboard', async () => {
      mockedGetToken.mockResolvedValue(voterToken as any);
      const request = createRequest('/dashboard');
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('x-middleware-next')).toBe('1');
    });

    it('allows VOTER to access /dashboard/vote/org-1', async () => {
      mockedGetToken.mockResolvedValue(voterToken as any);
      const request = createRequest('/dashboard/vote/org-1');
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('x-middleware-next')).toBe('1');
    });

    it('denies VOTER access to /admin and redirects to /dashboard', async () => {
      mockedGetToken.mockResolvedValue(voterToken as any);
      const request = createRequest('/admin');
      const response = await proxy(request);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/dashboard'
      );
    });

    it('denies VOTER access to /admin/users and redirects to /dashboard', async () => {
      mockedGetToken.mockResolvedValue(voterToken as any);
      const request = createRequest('/admin/users');
      const response = await proxy(request);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/dashboard'
      );
    });

    it('denies VOTER access to /admin/candidates and redirects to /dashboard', async () => {
      mockedGetToken.mockResolvedValue(voterToken as any);
      const request = createRequest('/admin/candidates');
      const response = await proxy(request);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/dashboard'
      );
    });

    it('denies VOTER access to /admin/results and redirects to /dashboard', async () => {
      mockedGetToken.mockResolvedValue(voterToken as any);
      const request = createRequest('/admin/results');
      const response = await proxy(request);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/dashboard'
      );
    });
  });

  describe('ADMIN role access', () => {
    const adminToken = {
      role: 'ADMIN',
      nim: '0000000001',
      sub: 'admin-1',
      name: 'Test Admin',
    };

    it('allows ADMIN to access /admin', async () => {
      mockedGetToken.mockResolvedValue(adminToken as any);
      const request = createRequest('/admin');
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('x-middleware-next')).toBe('1');
    });

    it('allows ADMIN to access /admin/users', async () => {
      mockedGetToken.mockResolvedValue(adminToken as any);
      const request = createRequest('/admin/users');
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('x-middleware-next')).toBe('1');
    });

    it('allows ADMIN to access /admin/candidates', async () => {
      mockedGetToken.mockResolvedValue(adminToken as any);
      const request = createRequest('/admin/candidates');
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('x-middleware-next')).toBe('1');
    });

    it('allows ADMIN to access /admin/results', async () => {
      mockedGetToken.mockResolvedValue(adminToken as any);
      const request = createRequest('/admin/results');
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('x-middleware-next')).toBe('1');
    });

    it('allows ADMIN to access /admin/audit', async () => {
      mockedGetToken.mockResolvedValue(adminToken as any);
      const request = createRequest('/admin/audit');
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('x-middleware-next')).toBe('1');
    });

    it('allows ADMIN to access /dashboard (voter routes)', async () => {
      mockedGetToken.mockResolvedValue(adminToken as any);
      const request = createRequest('/dashboard');
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('x-middleware-next')).toBe('1');
    });
  });
});
