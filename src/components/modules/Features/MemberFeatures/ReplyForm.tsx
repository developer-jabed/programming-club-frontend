"use client";

import { useTransition, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { createFeatureReply } from "@/service/features/features.service";

interface Props {
  featureRequestId: string;
  parentReplyId?: string;
  onSuccess?: () => void;
  placeholder?: string;
}

export default function ReplyForm({
  featureRequestId,
  parentReplyId,
  onSuccess,
  placeholder = "Write a reply…",
}: Props) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (parentReplyId) fd.set("parentReplyId", parentReplyId);

    startTransition(async () => {
      const res = await createFeatureReply(featureRequestId, null, fd);
      if (res.success) {
        toast.success(res.message || "Reply added");
        formRef.current?.reset();
        onSuccess?.();
      } else {
        toast.error(res.message || "Failed to reply");
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <textarea
        name="content"
        required
        rows={3}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Reply
        </button>
      </div>
    </form>
  );
}