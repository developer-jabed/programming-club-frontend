import { getAllTests } from "@/service/test/test.service";
import TestsClient from "@/components/modules/tests/TestsClient";
import CreateTestModal from "@/components/modules/tests/CreateTestModal";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export default async function TestsPage() {
  const testsRes = await getAllTests();
  const tests = testsRes.success ? testsRes.data : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tests & Quizzes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Practice, assessments, and skill checks
          </p>
        </div>
        <CreateTestModal />
      </div>

      <TestsClient tests={tests} />
    </div>
  );
}
