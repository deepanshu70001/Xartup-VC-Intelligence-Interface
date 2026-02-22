export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  company?: string | null;
  location?: string | null;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  location?: string | null;
}
