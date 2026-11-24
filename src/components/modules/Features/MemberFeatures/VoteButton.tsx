"use client";

import { useTransition, useState } from "react";
import { ThumbsUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toggleFeatureVote } from "@/service/features/features.service";

interface Props {
  requestId: string;
  initialVotes: number;
  initialHasVoted: boolean;
  disabled?: boolean;
}

export default function VoteButton({
  requestId,
  initialVotes,
  initialHasVoted,
  disabled,
}: Props) {
  const [votes, setVotes] = useState(initialVotes);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [pending, startTransition] = useTransition();

  const onToggle = () => {
    if (disabled) return;

    // optimistic update
    const nextVoted = !hasVoted;
    setHasVoted(nextVoted);
    setVotes((v) => (nextVoted ? v + 1 : Math.max(0, v - 1)));

    startTransition(async () => {
      const res = await toggleFeatureVote(requestId);
      if (res.success && res.data) {
        setHasVoted(res.data.voted);
        setVotes(res.data.votes);
      } else {
        // rollback
        setHasVoted(hasVoted);
        setVotes(votes);
        toast.error(res.message || "Could not update vote");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending || disabled}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition
        ${
          hasVoted
            ? "border-primary bg-primary/10 text-primary"
            : "border-border text-muted-foreground hover:bg-muted"
        }
        disabled:opacity-60`}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ThumbsUp
          className={`h-4 w-4 ${hasVoted ? "fill-current" : ""}`}
        />
      )}
      <span>{votes}</span>
    </button>
  );
}