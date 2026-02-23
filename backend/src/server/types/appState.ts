export interface PersistedAppState {
  companies: any[];
  allLists: any[];
  allSavedSearches: any[];
  allActivities: any[];
  userFavorites: Record<string, string[]>;
  userNotes: Record<string, Record<string, string>>;
  thesis: {
    sectors: string[];
    stages: string[];
    geography: string[];
    keywords: string[];
    antiPortfolio: string[];
  };
}

export interface AppStateRecord {
  userId: string;
  state: PersistedAppState;
  createdAt: string;
  updatedAt: string;
}
