import { getSiteSetting } from '@/lib/site-settings';
import { BrandLogo } from '@/components/BrandLogo';
import { LoginForm } from './LoginForm';

export default async function LoginPage() {
  const siteLogo = await getSiteSetting('site_logo');

  return (
    <div className="app-shell flex min-h-screen flex-col pt-16">
      <header className="top-nav public-header">
        <div className="page-container flex h-16 items-center justify-between">
          <BrandLogo href="/" logoUrl={siteLogo} />
          <div aria-hidden="true" className="hidden md:block" />
        </div>
      </header>

      <main className="grid flex-1 place-items-center px-4 py-14">
        <LoginForm />
      </main>

      <footer className="border-t-2 border-[var(--border)] bg-[var(--accent-blue)] text-[var(--ink)]">
        <div className="page-container flex flex-col gap-4 py-8 text-sm md:flex-row md:items-center md:justify-between">
          <p className="font-bold text-[var(--primary)]">
            PEMIRA 2026
          </p>
          <div className="flex gap-8 font-bold">
            <a href="/login">Login</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
