'use client';

interface VoteConfirmDialogProps {
  candidate: {
    id: string;
    nameKetua: string;
    nameWakil: string;
    photo: string;
    photoWakil: string;
  };
  orgName: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function VoteConfirmDialog({
  candidate,
  orgName,
  isOpen,
  onConfirm,
  onCancel,
  isSubmitting,
}: VoteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--primary)]/45"
        onClick={!isSubmitting ? onCancel : undefined}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="panel relative w-full max-w-md p-6 shadow-xl">
        <h2
          id="confirm-dialog-title"
          className="mb-4 text-lg font-extrabold text-[var(--primary)]"
        >
          Konfirmasi Pilihan
        </h2>

        <div className="mb-6">
          <p className="text-sm text-[var(--muted)]">
            Anda akan memberikan suara untuk:
          </p>

          <div className="mt-3 flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
            <div className="flex flex-shrink-0 -space-x-2">
            <div className="h-12 w-12 overflow-hidden rounded-lg border border-[var(--border)] bg-white">
              {candidate.photo ? (
                <img
                  src={candidate.photo}
                  alt={`Foto ${candidate.nameKetua}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="h-12 w-12 overflow-hidden rounded-lg border border-[var(--border)] bg-white">
              {candidate.photoWakil ? (
                <img
                  src={candidate.photoWakil}
                  alt={`Foto ${candidate.nameWakil}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-black text-[var(--primary)]">
                  {candidate.nameWakil.slice(0, 1)}
                </div>
              )}
            </div>
            </div>
            <div>
              <p className="font-extrabold text-[var(--primary)]">
                {candidate.nameKetua} &amp; {candidate.nameWakil}
              </p>
              <p className="text-xs text-[var(--muted)]">{orgName}</p>
            </div>
          </div>

          <p className="mt-4 text-sm font-bold text-[var(--danger)]">
            Perhatian: Suara yang sudah diberikan tidak dapat diubah.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn-secondary flex-1 disabled:opacity-50"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="btn-primary flex-1 disabled:opacity-50"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Mengirim...
              </span>
            ) : (
              'Ya, Kirim Suara'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
