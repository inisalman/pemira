'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="btn-secondary min-w-[44px] px-3"
      aria-label="Logout dari akun"
    >
      Logout
    </button>
  );
}
