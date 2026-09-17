export interface VoterElection {
  id: string
  name: string
  status: string
  startsAt: string | null
  endsAt: string | null
}

export interface VoterContest {
  id: string
  title: string
  hasVoted: boolean
  receiptCode: string | null
}

export interface CandidateOption {
  id: string
  number: number
  photoKey: string | null
  motto: string | null
  vision: string | null
  mission: string | null
  programs: string | null
  members: { name: string; position: 'CHAIR' | 'VICE_CHAIR' }[]
}

export interface VoterBallot {
  election: VoterElection
  contest: VoterContest
  canVote: boolean
  options: CandidateOption[]
}
