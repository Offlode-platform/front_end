export type ClientAssignment = {
  id: string;
  organization_id: string;
  client_id: string;
  user_id: string | null;
  assigned_at: string;
  assigned_by: string | null;
  unassigned_at: string | null;
  client_name?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  is_assigned: boolean;
};

export type ClientAssignmentCreate = {
  client_id: string;
  user_id?: string | null;
};

export type ClientAssignmentBulk = {
  client_ids: string[];
  user_id?: string | null;
};

export type ListClientAssignmentsQuery = {
  user_id?: string;
  client_id?: string;
  unassigned_only?: boolean;
  skip?: number;
  limit?: number;
};

export type ClientAssignmentResponse = ClientAssignment;
export type ListClientAssignmentsResponse = ClientAssignment[];
export type BulkAssignResponse = ClientAssignment[];
