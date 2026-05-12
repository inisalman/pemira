import Image from 'next/image';
import Link from 'next/link';

interface BrandLogoProps {
  href: string;
  logoUrl?: string;
}

export function BrandLogo({ href, logoUrl }: BrandLogoProps) {
  return (
    <Link href={href} className="flex items-center gap-3">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt="Logo Pemira"
          width={40}
          height={40}
          className="h-10 w-10 rounded-lg object-contain"
          unoptimized
        />
      ) : null}
      <span className="brand-text">Poltekkes Jakarta 1</span>
    </Link>
  );
}
