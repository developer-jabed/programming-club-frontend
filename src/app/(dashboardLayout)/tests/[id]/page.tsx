/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { getMyTestAttempt, getTestById } from "@/service/test/test.service";
import TestRunner from "@/components/modules/tests/TestRunner";

export const dynamic = "force-dynamic";

// Never send correct answers to the browser while the exam is running,
// or when the admin hides results.
function sanitizeAttempt(raw: any) {
  if (!raw) return null;
  const base = {
    id: raw.id,
    status: raw.status,
    startedAt: raw.startedAt,
    submittedAt: raw.submittedAt,
    timeTakenSec: raw.timeTakenSec,
  };
  const submitted = raw.status !== "IN_PROGRESS";
  const reveal = submitted && raw.test?.showResultImmediately !== false;
  return reveal ? raw : base;
}

export default async function TestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [testRes, attemptRes] = await Promise.all([
    getTestById(id),
    getMyTestAttempt(id),
  ]);

  if (!testRes.success || !testRes.data) {
    console.error("[TestPage] getTestById failed:", id, testRes);
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="text-lg font-semibold">Could not load this test</h1>
        <p className="text-sm text-muted-foreground">
          {(testRes as any).message || "Test not found"}
        </p>
        <Link
          href="/tests"
          className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to tests
        </Link>
      </div>
    );
  }

  const attempt = attemptRes.success ? sanitizeAttempt(attemptRes.data) : null;

  return <TestRunner test={testRes.data} attempt={attempt} />;
}