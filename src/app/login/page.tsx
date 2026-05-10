'use client';

import { useState, FormEvent } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
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
    <div className="app-shell flex min-h-screen flex-col">
      <header className="top-nav">
        <div className="page-container flex h-16 items-center justify-between">
          <Link href="/" className="brand-text">
            E-VOTE POLTEKKES JKT1
          </Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Navigasi utama">
            <Link href="/" className="nav-link">Beranda</Link>
            <Link href="/#panduan" className="nav-link">Panduan</Link>
          </nav>
        </div>
      </header>

      <main className="grid flex-1 place-items-center px-4 py-14">
        <form
          className="panel relative w-full max-w-[520px] space-y-6 overflow-hidden p-8 sm:p-12"
          onSubmit={handleSubmit}
          noValidate
          aria-label="Form login"
        >
          <div className="absolute left-0 top-0 h-1 w-32 bg-[var(--secondary)]" />
          <div className="text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-[var(--secondary)] text-4xl text-white shadow-lg shadow-emerald-200">
              ♢
            </div>
            <h1 className="mt-7 text-4xl font-black tracking-[-0.05em] text-[var(--primary)]">
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
              <label
                htmlFor="nim"
                className="block text-sm font-bold tracking-wide text-[var(--ink)]"
              >
                ♙&nbsp;&nbsp;NIM atau Username
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
                className="flex items-center justify-between text-sm font-bold tracking-wide text-[var(--ink)]"
              >
                <span>▣&nbsp;&nbsp;Password</span>
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
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-[var(--muted)]">◉</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Memproses...' : 'Masuk Sekarang  ↪'}
          </button>

          <div className="border-t border-[var(--border)] pt-7">
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-5 py-4 text-sm font-medium text-sky-800">
              ⓘ &nbsp; Gunakan akun Portal Mahasiswa aktif Anda.
            </div>
            <p className="mt-7 text-center text-base font-bold text-[var(--ink)]">
              ☎ &nbsp; Butuh bantuan? Hubungi Admin
            </p>
          </div>
        </form>
      </main>

      <footer className="bg-[var(--primary)] text-white">
        <div className="page-container flex flex-col gap-4 py-8 text-sm md:flex-row md:items-center md:justify-between">
          <p className="font-bold">
            © 2024 Poltekkes Kemenkes Jakarta 1. Komisi Pemilihan Raya.
          </p>
          <div className="flex gap-8 text-emerald-100">
            <span>Kebijakan Privasi</span>
            <span>Kontak Kami</span>
            <span>Peta Situs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
