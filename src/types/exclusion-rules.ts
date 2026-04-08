export type ExclusionRuleType =
  | "supplier_name"
  | "description"
  | "amount_range"
  | "category";

export type ExclusionMatchType =
  | "contains"
  | "equals"
  | "starts_with"
  | "ends_with"
  | "regex";

export type ExclusionRuleCreate = {
  organization_id: string;
  rule_type: ExclusionRuleType;
  pattern: string;
  match_type?: ExclusionMatchType;
  reason?: string | null;
  enabled?: boolean;
};

export type ExclusionRuleUpdate = {
  pattern?: string;
  match_type?: ExclusionMatchType;
  reason?: string | null;
  enabled?: boolean;
};

export type ExclusionRuleResponse = {
  id: string;
  organization_id: string;
  rule_type: ExclusionRuleType;
  pattern: string;
  match_type: ExclusionMatchType;
  reason: string | null;
  enabled: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
};

export type ExclusionRuleListResponse = {
  organization_id: string;
  total: number;
  active: number;
  inactive: number;
  rules: ExclusionRuleResponse[];
};

export type BulkExclusionRuleCreate = {
  organization_id: string;
  rules: ExclusionRuleCreate[];
};
