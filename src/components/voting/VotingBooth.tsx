'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CandidateCard } from './CandidateCard';
import { VoteConfirmDialog } from './VoteConfirmDialog';
import { submitVote } from '@/app/dashboard/vote/[orgId]/actions';

interface Candidate {
  id: string;
  nameKetua: string;
  nameWakil: string;
  vision: string;
  mission: string;
  photo: string;
  photoWakil: string;
}

interface VotingBoothProps {
  orgId: string;
  orgName: string;
  candidates: Candidate[];
}

export function VotingBooth({ orgId, orgName, candidates }: VotingBoothProps) {
  const router = useRouter();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  function handleSelect(candidateId: string) {
    if (isSubmitting || successMessage) return;
    setSelectedCandidateId(candidateId);
    setShowConfirmDialog(true);
    setErrorMessage(null);
  }

  function handleCancelConfirm() {
    setShowConfirmDialog(false);
  }

  async function handleConfirmVote() {
    if (!selectedCandidateId) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await submitVote(orgId, selectedCandidateId);

      if (result.success) {
        setShowConfirmDialog(false);
        setSuccessMessage(true);
        // Redirect to dashboard after showing success message
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setShowConfirmDialog(false);
        switch (result.error) {
          case 'ALREADY_VOTED':
            setErrorMessage('Anda sudah memilih untuk organisasi ini.');
            setTimeout(() => router.push('/dashboard'), 2000);
            break;
          case 'INVALID_ACCESS':
            setErrorMessage('Anda tidak memiliki hak pilih untuk organisasi ini.');
            break;
          case 'INVALID_CANDIDATE':
            setErrorMessage('Kandidat tidak valid.');
            break;
          default:
            setErrorMessage('Suara gagal direkam, silakan coba lagi.');
            break;
        }
      }
    } catch {
      setShowConfirmDialog(false);
      setErrorMessage('Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successMessage) {
    return (
      <div className="panel flex flex-col items-center justify-center bg-emerald-50 p-8 text-center">
        <svg
          className="mb-4 h-16 w-16 text-[var(--success)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-xl font-extrabold text-[var(--success)]">
          Suara Berhasil Direkam!
        </h2>
        <p className="mt-2 text-sm text-emerald-700">
          Terima kasih telah berpartisipasi. Anda akan dialihkan ke dashboard...
        </p>
      </div>
    );
  }

  return (
    <div>
      {errorMessage && (
        <div
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <div className="grid gap-7 xl:grid-cols-2">
        {candidates.map((candidate, index) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            number={index + 1}
            isSelected={selectedCandidateId === candidate.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <div className="mt-16 rounded-lg border-2 border-[var(--primary)] bg-[var(--accent-blue)] px-6 py-10 shadow-[6px_6px_0_var(--accent-purple)] sm:flex sm:items-center sm:gap-8 sm:text-left">
        <div className="mx-auto grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-[var(--shadow-hard)] bg-[var(--primary)] text-2xl font-black text-white sm:mx-0">
          i
        </div>
        <div>
          <h3 className="mt-6 text-2xl font-black text-[var(--primary)] sm:mt-0">
            Informasi Penting
          </h3>
          <p className="mt-3 max-w-4xl leading-7 text-[var(--ink)]">
            Satu akun hanya memiliki kesempatan <strong>satu kali memilih.</strong>{' '}
            Pastikan pilihanmu sudah benar sebelum menekan tombol konfirmasi.
            Sistem mengenkripsi pilihan Anda secara aman.
          </p>
        </div>
      </div>

      {selectedCandidate && (
        <VoteConfirmDialog
          candidate={selectedCandidate}
          orgName={orgName}
          isOpen={showConfirmDialog}
          onConfirm={handleConfirmVote}
          onCancel={handleCancelConfirm}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
