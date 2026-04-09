export type ImportMappingTemplateCreate = {
  name: string;
  data_type: string;
  column_mapping: Record<string, string>;
  date_format?: string;
  decimal_separator?: string;
  thousand_separator?: string;
  currency_code?: string;
  is_default?: boolean;
};

export type ImportMappingTemplateResponse = {
  id: string;
  organization_id: string;
  name: string;
  platform: string;
  data_type: string;
  column_mapping: Record<string, string>;
  date_format: string | null;
  decimal_separator: string | null;
  thousand_separator: string | null;
  currency_code: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type ImportMappingTemplateListResponse = {
  items: ImportMappingTemplateResponse[];
  total: number;
};
