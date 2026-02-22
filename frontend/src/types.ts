export interface Company {
  id: string;
  name: string;
  domain: string;
  logo_url: string;
  createdAt?: string;
  description: string;
  industry: string;
  stage: string;
  location: string;
  founded_year: number;
  employee_count: string;
  last_funding_date?: string;
  total_funding?: string;
  tags: string[];
  enrichment?: EnrichmentData;
  notes?: string;
  isFavorite?: boolean;
}

export interface EnrichmentData {
  summary: string;
  what_they_do: string[];
  keywords: string[];
  derived_signals: string[];
  source?: string;
  sources?: string[];
  timestamp: string;
}

export interface List {
  id: string;
  userId: string;
  name: string;
  description?: string;
  companyIds: string[];
  createdAt: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: Record<string, any>;
  createdAt: string;
}
