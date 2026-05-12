'use client';

import { useState, FormEvent } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function LoginForm() {
  const router = useRouter();
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        nim,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('NIM atau password salah');
      } else {
        const session = await getSession();
        router.push(session?.user.role === 'ADMIN' ? '/admin' : '/dashboard');
        router.refresh();
      }
    } catch {
      setError('NIM atau password salah');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      className="panel relative w-full max-w-[520px] space-y-6 overflow-hidden p-8 sm:p-12"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Form login"
    >
      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[var(--accent)]/60" />
      <div className="absolute -left-10 bottom-10 h-28 w-28 rounded-full bg-[var(--accent-purple)]/20" />
      <div className="text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-lg border-2 border-[var(--shadow-hard)] bg-[var(--secondary)] text-2xl font-black text-[var(--primary-dark)] shadow-[5px_5px_0_var(--shadow-hard)]">
          01
        </div>
        <h1 className="mt-7 text-4xl font-black text-[var(--primary)]">
          Masuk Sekarang
        </h1>
        <p className="mt-2 text-lg text-[var(--muted)]">
          Login E-Vote Poltekkes JKT 1
        </p>
      </div>

      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="nim" className="block text-sm font-bold text-[var(--ink)]">
            NIM atau Username
          </label>
          <input
            id="nim"
            name="nim"
            type="text"
            autoComplete="username"
            required
            value={nim}
            onChange={(e) => setNim(e.target.value)}
            className="field mt-2"
            placeholder="Masukkan NIM Anda"
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="flex items-center justify-between text-sm font-bold text-[var(--ink)]"
          >
            <span>Password</span>
            <span className="text-xs font-medium text-[var(--primary)]">Lupa Password?</span>
          </label>
          <div className="relative mt-2">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field pr-12"
              placeholder="••••••••"
              disabled={isLoading}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--border)] px-2 py-0.5 text-xs font-black text-[var(--muted)]">••</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? 'Memproses...' : 'Masuk Sekarang'}
      </button>

      <div className="border-t-2 border-[var(--border)] pt-7">
        <div className="rounded-lg border-2 border-[var(--shadow-hard)] bg-[var(--accent-blue)] px-5 py-4 text-sm font-medium text-[var(--ink)]">
          Gunakan akun Portal Mahasiswa aktif Anda.
        </div>
        <p className="mt-7 text-center text-base font-bold text-[var(--ink)]">
          Butuh bantuan? Hubungi Admin
        </p>
      </div>
    </form>
  );
}
