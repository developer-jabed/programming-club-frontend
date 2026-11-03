import { getAllUsers } from "@/service/user/user.service";
import UsersClient from "@/components/modules/users/UsersClient";
import CreateUserModal from "@/components/modules/users/CreateUserModal";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export default async function AdminUsersPage() {
  const usersRes = await getAllUsers();
  const users = usersRes.success ? usersRes.data : [];

  console.log("users:", users)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Users & Roles
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage members, moderators, and permissions
          </p>
        </div>
        <CreateUserModal />
      </div>

      <UsersClient users={users} />
    </div>
  );
}
