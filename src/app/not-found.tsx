

import NotFoundContent from "@/components/not-found/notFound";
import { Suspense } from "react";
export const dynamic = "force-dynamic";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Suspense
        fallback={
          <div className="text-center">
            <h1 className="text-8xl font-bold text-primary">404</h1>
            <p className="mt-4 text-muted-foreground">Loading....</p>
          </div>
        }
      >
        <NotFoundContent />
      </Suspense>
    </div>
  );
}