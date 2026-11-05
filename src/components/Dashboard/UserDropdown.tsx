"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/service/auth/logoutUser";
import { UserInfo } from "@/types/userInterface";

import { ChevronDown, KeyRound, Loader2, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

interface UserDropdownProps {
  userInfo: UserInfo;
}

const ITEM =
  "cursor-pointer rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:bg-white/[0.06] focus:text-white";

/* Picture with fallback to the first letter (also if the image fails to load) */
function UserAvatar({
  name,
  picture,
  className,
  fallbackClassName,
}: {
  name: string;
  picture?: string | null;
  className?: string;
  fallbackClassName?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = !!picture && failedSrc !== picture;

  return showImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={picture}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(picture)}
      className={cn("shrink-0 rounded-xl object-cover", className)}
    />
  ) : (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-300 to-teal-500 font-bold text-[#04110d]",
        className,
        fallbackClassName,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

const UserDropdown = ({ userInfo }: UserDropdownProps) => {
  const [isPending, startTransition] = useTransition();
  const role = userInfo.role.toLowerCase();
  const picture = (userInfo as { profilePicture?: string | null })
    .profilePicture;

  const handleLogout = () =>
    startTransition(async () => {
      await logoutUser();
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="group flex h-auto items-center gap-3 rounded-xl px-2 py-1.5 text-slate-200 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white data-[state=open]:bg-white/[0.06] md:px-2.5"
        >
          <UserAvatar
            name={userInfo.name}
            picture={picture}
            className="h-9 w-9 ring-2 ring-white/10"
            fallbackClassName="text-sm shadow-[0_4px_14px_-2px_rgba(16,185,129,0.5)]"
          />

          <div className="hidden flex-col items-start leading-tight md:flex">
            <p className="max-w-[140px] truncate text-sm font-semibold text-white">
              {userInfo.name}
            </p>
            <p className="text-xs capitalize text-slate-400">{role}</p>
          </div>

          <ChevronDown className="hidden h-4 w-4 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180 md:block" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-72 rounded-2xl border border-white/10 bg-[#0b1714]/95 p-2 text-slate-200 shadow-2xl shadow-black/60 backdrop-blur-xl"
      >
        <DropdownMenuLabel className="p-3">
          <div className="flex items-center gap-3.5">
            <UserAvatar
              name={userInfo.name}
              picture={picture}
              className="h-12 w-12"
              fallbackClassName="text-xl"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-white">
                {userInfo.name}
              </p>
              <p className="truncate text-xs font-normal text-slate-400">
                {userInfo.email}
              </p>
              <span className="mt-1.5 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                {role}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/[0.07]" />

        <div className="py-1">
          <DropdownMenuItem asChild className={ITEM}>
            <Link href="/my-profile" className="flex items-center gap-3">
              <User className="h-4 w-4 text-slate-400" />
              <span>View Profile</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className={ITEM}>
            <Link href="/change-password" className="flex items-center gap-3">
              <KeyRound className="h-4 w-4 text-slate-400" />
              <span>Change Password</span>
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-white/[0.07]" />

        <DropdownMenuItem
          disabled={isPending}
          onSelect={(e) => {
            e.preventDefault(); // keep menu open to show the pending state
            handleLogout();
          }}
          className="mt-1 cursor-pointer rounded-xl px-3 py-2.5 text-sm text-red-400 focus:bg-red-500/10 focus:text-red-300"
        >
          <div className="flex w-full items-center gap-3">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span>{isPending ? "Signing out…" : "Logout"}</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;