// Vote Service types
export interface VoteResult {
  success: boolean;
  error?: 'ALREADY_VOTED' | 'INVALID_ACCESS' | 'INVALID_CANDIDATE' | 'TRANSACTION_FAILED';
}

export interface VoteCount {
  candidateId: string;
  candidateName: string;
  count: number;
}

export interface OrgVoteCount {
  orgId: string;
  orgName: string;
  totalEligible: number;
  totalVoted: number;
  candidates: VoteCount[];
}

// User Service types
export interface CreateUserInput {
  nim: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'VOTER';
  organizationIds?: string[];
}

export interface UpdateUserInput {
  nim?: string;
  name?: string;
  password?: string;
  role?: 'ADMIN' | 'VOTER';
  organizationIds?: string[];
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  failedRows: FailedRow[];
}

export interface FailedRow {
  row: number;
  nim: string;
  reason: string;
}

// Candidate Service types
export interface CreateCandidateInput {
  organizationId: string;
  nameKetua: string;
  nameWakil: string;
  vision: string;
  mission: string;
  photo: string;
}

export interface UpdateCandidateInput {
  organizationId?: string;
  nameKetua?: string;
  nameWakil?: string;
  vision?: string;
  mission?: string;
  photo?: string;
}

// Audit Service types
export type AuditActionType =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'VOTE_CAST'
  | 'USER_CREATED'
  | 'USER_DELETED'
  | 'USER_UPDATED'
  | 'CANDIDATE_CREATED'
  | 'CANDIDATE_DELETED'
  | 'CANDIDATE_UPDATED'
  | 'BULK_IMPORT';

export interface AuditEntry {
  actorId: string;
  actionType: AuditActionType;
  details: string;
  metadata?: Record<string, unknown>;
}

export interface AuditFilterParams {
  actionType?: AuditActionType;
  actorId?: string;
  startDate?: Date;
  endDate?: Date;
}

// Pagination types
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface FilterParams {
  search?: string;
  role?: 'ADMIN' | 'VOTER';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Delete result
export interface DeleteResult {
  success: boolean;
  error?: string;
}
