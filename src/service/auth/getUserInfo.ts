/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { UserInfo } from "@/types/userInterface";

export const getUserInfo = async (): Promise<UserInfo | null> => {
  try {
    const response = await serverFetch.get("/auth/me", {
      cache: "force-cache",
      next: {
        revalidate: 1800, // 30 minutes
        tags: ["user-info"],
      },
    });

    const result = await response.json();

    if (!result.success || !result.data) {
      return null;
    }

    const user = result.data;

    // Clean & consistent shape
    const userInfo: UserInfo = {
      id: user.id,
      name: user.name || "Unknown User",
      email: user.email,
      role: user.role, 
      status: user.status,
      profilePicture: user.profilePicture || null,
      phone: user.phone || null,
      lastLoginAt: user.lastLoginAt || null,
      createdAt: user.createdAt,
    
      roll: user.roll || null,
      semester: user.semester || null,
      shift: user.shift || null,
      group: user.group || null,
      registration: user.registration || null,
      bloodGroup: user.bloodGroup || null,
      presentAddress: user.presentAddress || null,
    };

    return userInfo;
  } catch (error: any) {
    console.error("[getUserInfo]", error?.message || error);
    return null;
  }
};