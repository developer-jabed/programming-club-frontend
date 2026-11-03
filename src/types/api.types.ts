/**
 * Common API response shape used by the backend
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * User roles in the Programming Club
 */
export type UserRole = "ADMIN" | "MODERATOR" | "MEMBER";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";

export type ProjectStatus =
  | "DRAFT"
  | "OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ARCHIVED";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "COMPLETED"
  | "CANCELLED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type SubmissionStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "CHANGES_REQUESTED"
  | "REJECTED";

export type TestStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED" | "EXPIRED";
