import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing auth
vi.mock('./prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}));

import { authOptions } from './auth';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

const mockedFindUnique = vi.mocked(prisma.user.findUnique);
const mockedCompare = vi.mocked(bcrypt.compare);

// Extract the authorize function from the credentials provider
function getAuthorize() {
  const provider = authOptions.providers[0] as any;
  return provider.options.authorize;
}

describe('NextAuth Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authOptions structure', () => {
    it('should use JWT session strategy', () => {
      expect(authOptions.session?.strategy).toBe('jwt');
    });

    it('should set custom sign-in page to /login', () => {
      expect(authOptions.pages?.signIn).toBe('/login');
    });

    it('should have one provider configured', () => {
      expect(authOptions.providers).toHaveLength(1);
    });

    it('should use credentials provider', () => {
      const provider = authOptions.providers[0] as any;
      expect(provider.id).toBe('credentials');
      expect(provider.type).toBe('credentials');
    });
  });

  describe('authorize function', () => {
    it('should return null when credentials are missing', async () => {
      const authorize = getAuthorize();
      const result = await authorize({}, {} as any);
      expect(result).toBeNull();
    });

    it('should return null when nim is missing', async () => {
      const authorize = getAuthorize();
      const result = await authorize({ password: 'test123' }, {} as any);
      expect(result).toBeNull();
    });

    it('should return null when password is missing', async () => {
      const authorize = getAuthorize();
      const result = await authorize({ nim: '12345' }, {} as any);
      expect(result).toBeNull();
    });

    it('should return null when user is not found', async () => {
      mockedFindUnique.mockResolvedValue(null);

      const authorize = getAuthorize();
      const result = await authorize(
        { nim: '12345', password: 'test123' },
        {} as any
      );

      expect(result).toBeNull();
      expect(mockedFindUnique).toHaveBeenCalledWith({
        where: { nim: '12345' },
      });
    });

    it('should return null when password is invalid', async () => {
      mockedFindUnique.mockResolvedValue({
        id: 'user-1',
        nim: '12345',
        name: 'Test User',
        password: '$2a$10$hashedpassword',
        role: 'VOTER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockedCompare.mockResolvedValue(false as never);

      const authorize = getAuthorize();
      const result = await authorize(
        { nim: '12345', password: 'wrongpassword' },
        {} as any
      );

      expect(result).toBeNull();
      expect(mockedCompare).toHaveBeenCalledWith(
        'wrongpassword',
        '$2a$10$hashedpassword'
      );
    });

    it('should return user object when credentials are valid', async () => {
      mockedFindUnique.mockResolvedValue({
        id: 'user-1',
        nim: '12345',
        name: 'Test User',
        password: '$2a$10$hashedpassword',
        role: 'VOTER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockedCompare.mockResolvedValue(true as never);

      const authorize = getAuthorize();
      const result = await authorize(
        { nim: '12345', password: 'correctpassword' },
        {} as any
      );

      expect(result).toEqual({
        id: 'user-1',
        nim: '12345',
        name: 'Test User',
        role: 'VOTER',
      });
    });

    it('should return admin user when admin credentials are valid', async () => {
      mockedFindUnique.mockResolvedValue({
        id: 'admin-1',
        nim: '00001',
        name: 'Admin User',
        password: '$2a$10$hashedpassword',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockedCompare.mockResolvedValue(true as never);

      const authorize = getAuthorize();
      const result = await authorize(
        { nim: '00001', password: 'adminpass' },
        {} as any
      );

      expect(result).toEqual({
        id: 'admin-1',
        nim: '00001',
        name: 'Admin User',
        role: 'ADMIN',
      });
    });
  });

  describe('JWT callback', () => {
    it('should add role and nim to token on sign in', async () => {
      const jwtCallback = authOptions.callbacks!.jwt!;
      const token = { sub: 'user-1' };
      const user = { id: 'user-1', nim: '12345', name: 'Test', role: 'VOTER' };

      const result = await (jwtCallback as Function)({
        token,
        user,
        account: null,
        trigger: 'signIn',
      });

      expect(result.role).toBe('VOTER');
      expect(result.nim).toBe('12345');
    });

    it('should preserve existing token data on subsequent calls', async () => {
      const jwtCallback = authOptions.callbacks!.jwt!;
      const token = { sub: 'user-1', role: 'ADMIN', nim: '00001' };

      const result = await (jwtCallback as Function)({
        token,
        user: undefined,
        account: null,
      });

      // When user is undefined (subsequent calls), token stays unchanged
      expect(result.role).toBe('ADMIN');
      expect(result.nim).toBe('00001');
    });
  });

  describe('session callback', () => {
    it('should add id, role, and nim to session user', async () => {
      const sessionCallback = authOptions.callbacks!.session!;
      const session = {
        user: { name: 'Test', email: null, image: null },
        expires: '',
      };
      const token = { sub: 'user-1', role: 'VOTER', nim: '12345' };

      const result = await (sessionCallback as Function)({ session, token });

      expect(result.user.id).toBe('user-1');
      expect(result.user.role).toBe('VOTER');
      expect(result.user.nim).toBe('12345');
    });
  });
});
