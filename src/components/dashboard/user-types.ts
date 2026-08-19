export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  image?: string | null;
  emailVerified?: boolean;
  banned?: boolean | null;
}
