// components/NotFoundContent.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFoundContent() {
    const router = useRouter();

    return (
        <div className="text-center">
            <h1 className="text-8xl font-bold text-primary">404</h1>
            <p className="text-lg text-muted-foreground mt-4">Page Not Found</p>

            <div className="mt-6 flex justify-center gap-4">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft /> Go Back
                </Button>
                <Button asChild>
                    <Link href="/">
                        <Home /> Back to Home
                    </Link>
                </Button>
            </div>
        </div>
    );
}