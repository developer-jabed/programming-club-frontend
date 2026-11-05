/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAllTests, getMyTestAttempt } from "@/service/test/test.service";
import MemberTestsList from "@/components/modules/tests/MemberTestsList";

export const dynamic = "force-dynamic";

export default async function TestsPage() {
  const res = await getAllTests("limit=100&sortBy=createdAt&sortOrder=desc");
  const tests: any[] = res.success
    ? (res.data as any[]).filter((t) => t.status === "PUBLISHED")
    : [];

  // One lookup per test; a missing attempt just means "not taken yet"
  const entries = await Promise.all(
    tests.map(async (t) => {
      const r = await getMyTestAttempt(t.id);
      const a = r.success ? (r.data as any) : null;
      return [
        t.id,
        a
          ? {
              status: a.status as string,
              score: a.score ?? null,
              percentage: a.percentage ?? null,
            }
          : null,
      ] as const;
    })
  );

  const attempts = Object.fromEntries(entries.filter(([, a]) => a !== null));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Tests & Quizzes
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Practice, assessments, and skill checks
        </p>
      </div>
      <MemberTestsList tests={tests} attempts={attempts as any} />
    </div>
  );
}