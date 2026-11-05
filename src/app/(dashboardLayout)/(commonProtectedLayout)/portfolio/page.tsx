/* eslint-disable @next/next/no-img-element */

import {
  Calendar,
  Clock,
  Droplet,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import { getUserInfo } from "@/service/auth/getUserInfo";

export const dynamic = "force-dynamic";

const initials = (name?: string) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

const formatDate = (d?: string | null, pattern = "MMM d, yyyy") => {
  if (!d) return null;
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? null : format(date, pattern);
};

const Page = async () => {
  const user = await getUserInfo();

  if (!user) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Portfolio
        </h1>
        <p className="text-sm text-destructive">Could not load your profile.</p>
      </div>
    );
  }

  const contacts = [
    { icon: Mail, value: user.email },
    { icon: Phone, value: user.phone },
    { icon: MapPin, value: user.presentAddress },
    { icon: Droplet, value: user.bloodGroup ? `Blood group: ${user.bloodGroup}` : null },
  ].filter((c) => c.value);

  const academic = [
    { label: "Roll", value: user.roll },
    { label: "Registration", value: user.registration },
    { label: "Semester", value: user.semester },
    { label: "Shift", value: user.shift },
    { label: "Group", value: user.group },
  ].filter((i) => i.value !== null && i.value !== undefined && i.value !== "");

  const joined = formatDate(user.createdAt);
  const lastLogin = formatDate(user.lastLoginAt, "MMM d, yyyy, h:mm a");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Portfolio
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your profile overview
        </p>
      </div>

      {/* Header card */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.name}
              className="h-24 w-24 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {initials(user.name)}
            </div>
          )}

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="truncate text-xl font-bold">{user.name}</h2>

            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              {user.role && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {user.role}
                </span>
              )}
              {user.status && (
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {user.status}
                </span>
              )}
            </div>

            {contacts.length > 0 && (
              <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm sm:justify-start">
                {contacts.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-1.5 text-muted-foreground"
                  >
                    <c.icon className="h-4 w-4 text-primary" />
                    <span className="break-all">{c.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Academic info */}
      {academic.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold">Academic info</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {academic.map((i) => (
              <div
                key={i.label}
                className="rounded-xl border border-border bg-card p-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {i.label}
                </p>
                <p className="mt-1 break-words text-base font-bold">
                  {String(i.value)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Account */}
      {(joined || lastLogin) && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold">Account</h2>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
            {joined && (
              <p className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                Joined {joined}
              </p>
            )}
            {lastLogin && (
              <p className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                Last login {lastLogin}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Page;