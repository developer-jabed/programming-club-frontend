import { getAllSectors } from "@/service/sector/sector.service";
import { getAllUsers } from "@/service/user/user.service";
import SectorsClient from "@/components/modules/sectors/SectorsClient";
import CreateSectorModal from "@/components/modules/sectors/CreateSectorModal";

export const dynamic = "force-dynamic";

export default async function SectorsPage() {
  const [sectorsRes, usersRes] = await Promise.all([
    getAllSectors(),
    getAllUsers("limit=500"),
  ]);

  const sectors = sectorsRes.success ? sectorsRes.data : [];
  const users = usersRes.success ? usersRes.data : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sectors
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage skill areas and communities inside the club
          </p>
        </div>
        <CreateSectorModal />
      </div>

      <SectorsClient sectors={sectors} users={users} />
    </div>
  );
}