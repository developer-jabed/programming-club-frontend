import type { UserInfo } from "@/types/userInterface";

export const PORTFOLIO_URL =
  "https://programming-club-frontend.vercel.app/portfolio";
export const FACEBOOK_URL = "https://www.facebook.com/share/1C6wftAgnL/";
export const WHATSAPP_URL = "https://chat.whatsapp.com/FTtrQXJ6JsP5nf3HZBlpYv";
export const MESSENGER_URL =
  "https://m.me/j/XVcd5aLSx5Cnnoni/?send_source=gc%3Acopy_invite_link_t";

const REQUIRED_FIELDS: { key: keyof UserInfo; label: string }[] = [
  { key: "profilePicture", label: "Profile picture" },
  { key: "phone", label: "Phone" },
  { key: "roll", label: "Roll" },
  { key: "semester", label: "Semester" },
  { key: "shift", label: "Shift" },
  { key: "group", label: "Group" },
  { key: "registration", label: "Registration" },
  { key: "bloodGroup", label: "Blood group" },
  { key: "presentAddress", label: "Present address" },
];

export function getMissingProfileFields(user: UserInfo | null): string[] {
  if (!user) return [];
  return REQUIRED_FIELDS.filter(({ key }) => {
    const value = user[key];
    return value === null || value === undefined || value === "";
  }).map(({ label }) => label);
}