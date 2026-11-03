/**
 * Programming Club – All Services
 *
 * Usage:
 *   import { getAllProjects, createProject } from "@/service";
 *   // or
 *   import { getAllProjects } from "@/service/project/project.service";
 */

// Auth
export { getMe, changePasswordAction } from "./auth/auth.service";

// Users
export {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "./user/user.service";

// Sectors
export {
  getAllSectors,
  getSectorById,
  createSector,
  updateSector,
  deleteSector,
  joinSector,
  leaveSector,
  getSectorMembers,
} from "./sector/sector.service";

// Projects
export {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  requestJoinProject,
  handleProjectMember,
} from "./project/project.service";

// Tasks
export {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "./task/task.service";

// Submissions
export {
  submitTask,
  getTaskSubmissions,
  reviewTaskSubmission,
  submitProject,
  reviewProjectSubmission,
} from "./submission/submission.service";

// Tests
export {
  getAllTests,
  getTestById,
  createTest,
  updateTest,
  publishTest,
  deleteTest,
  startTestAttempt,
  submitTestAttempt,
  getMyTestAttempt,
} from "./test/test.service";

// Chat
export {
  getProjectMessages,
  sendMessage,
  deleteMessage,
} from "./chat/chat.service";

// Notifications
export {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "./notification/notification.service";

// Analytics
export {
  getDashboardStats,
  getRecentActivities,
  getLeaderboard,
  getProjectStats,
  getMonthlyGrowth,
  getSectorStats,
} from "./analytics/analytics.service";
