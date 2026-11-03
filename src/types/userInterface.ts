export type UserRole = "ADMIN" | "MODERATOR" | "MEMBER";

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: string;
  profilePicture?: string | null;
  phone?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  // Optional (legacy / extra)
  roll?: string | null;
  semester?: number | null;
  shift?: string | null;
  group?: string | null;
  registration?: string | null;
  bloodGroup?: string | null;
  presentAddress?: string | null;
}