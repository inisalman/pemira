import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      nim: string;
      name: string;
      role: string;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    nim: string;
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    nim?: string;
  }
}
