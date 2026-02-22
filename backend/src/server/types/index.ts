export interface LiveNewsItem {
  id: string;
  company: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

export interface ScoutContextCompany {
  id?: string;
  name: string;
  industry?: string;
  stage?: string;
  location?: string;
  employee_count?: string;
  total_funding?: string;
  tags?: string[];
  description?: string;
  enrichment?: {
    summary?: string;
    keywords?: string[];
    derived_signals?: string[];
  } | null;
}
