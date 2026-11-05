/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidatePath, updateTag } from "next/cache";

const SECTORS_PATH = "/admin/sectors";

const errMsg = (error: any, fallback: string) =>
  process.env.NODE_ENV === "development" ? error.message : fallback;

async function parse(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

const refresh = (sectorId: string) => {
  updateTag("sectors-list");
  updateTag(`sector-${sectorId}`);
  updateTag("users-list");
  revalidatePath(SECTORS_PATH);
};

// ─────────────────────────────────────────────────────────────
// Get members of a sector
// ─────────────────────────────────────────────────────────────
export async function getSectorMembers(sectorId: string) {
  try {
    const response = await serverFetch.get(`/sectors/${sectorId}`, {
      cache: "no-store",
    });
    const result = await parse(response);

    if (result?.success) {
      const raw = result.data?.members ?? result.data?.users ?? [];
      const data = raw.map((m: any) => m.user ?? m);
      return { success: true, data };
    }
    return {
      success: false,
      message: result?.message || "Failed to load sector members",
      data: [],
    };
  } catch (error: any) {
    console.error("[getSectorMembers]", error);
    return { success: false, message: errMsg(error, "Something went wrong"), data: [] };
  }
}

// ─────────────────────────────────────────────────────────────
// Assign members to a sector
// ─────────────────────────────────────────────────────────────
export async function assignMembersToSector(sectorId: string, userIds: string[]) {
  try {
    if (!userIds.length) {
      return { success: false, message: "Select at least one member" };
    }

    const response = await serverFetch.post(`/sectors/${sectorId}/members`, {
      body: JSON.stringify({ userIds }),
      headers: { "Content-Type": "application/json" },
    });
    const result = await parse(response);

    if (result?.success) {
      refresh(sectorId);
      return {
        success: true,
        message:
          result.message ||
          `${userIds.length} member${userIds.length > 1 ? "s" : ""} assigned!`,
      };
    }
    return { success: false, message: result?.message || "Failed to assign members" };
  } catch (error: any) {
    console.error("[assignMembersToSector]", error);
    return { success: false, message: errMsg(error, "Something went wrong. Please try again.") };
  }
}

// ─────────────────────────────────────────────────────────────
// Remove a member from a sector
// ─────────────────────────────────────────────────────────────
export async function removeMemberFromSector(sectorId: string, userId: string) {
  try {
    const response = await serverFetch.delete(
      `/sectors/${sectorId}/members/${userId}`
    );
    const result = await parse(response);

    if (result?.success) {
      refresh(sectorId);
      return { success: true, message: result.message || "Member removed" };
    }
    return { success: false, message: result?.message || "Failed to remove member" };
  } catch (error: any) {
    console.error("[removeMemberFromSector]", error);
    return { success: false, message: errMsg(error, "Something went wrong. Please try again.") };
  }
}