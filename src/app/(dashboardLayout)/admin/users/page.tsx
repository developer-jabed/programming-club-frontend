import { getAllUsers } from "@/service/user/user.service";
import UsersClient from "@/components/modules/users/UsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const res = await getAllUsers("limit=500&sortBy=createdAt&sortOrder=desc");
  const users = res.success ? res.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Users & Roles
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage members, moderators, and permissions
        </p>
      </div>

      <UsersClient users={users} />
    </div>
  );
}