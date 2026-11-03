/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";

// ─────────────────────────────────────────────────────────────
// Get All Sectors
// ─────────────────────────────────────────────────────────────
export async function getAllSectors(query?: string) {
  try {
    const response = await serverFetch.get(
      `/sectors${query ? `?${query}` : ""}`,
      { next: { tags: ["sectors-list"] } }
    );

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: result.data,
        meta: result.meta,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to fetch sectors",
      data: [],
    };
  } catch (error: any) {
    console.error("[getAllSectors]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
      data: [],
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Get Single Sector
// ─────────────────────────────────────────────────────────────
export async function getSectorById(id: string) {
  try {
    const response = await serverFetch.get(`/sectors/${id}`, {
      next: { tags: [`sector-${id}`] },
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Sector not found",
      data: null,
    };
  } catch (error: any) {
    console.error("[getSectorById]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
      data: null,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Create Sector
// ─────────────────────────────────────────────────────────────
export async function createSector(_prevState: any, formData: FormData) {
  try {
    const payload = {
      name: formData.get("name") as string,
      slug: (formData.get("slug") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      icon: (formData.get("icon") as string) || undefined,
      color: (formData.get("color") as string) || undefined,
      order: formData.get("order") ? Number(formData.get("order")) : 0,
      isActive: formData.get("isActive") !== "false",
    };

    if (!payload.name) {
      return {
        success: false,
        message: "Sector name is required",
        errors: { name: "Name is required" },
      };
    }

    const response = await serverFetch.post("/sectors", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success) {
      revalidateTag("sectors-list", "max");
      revalidateTag("admin-dashboard", "max");
      return {
        success: true,
        message: result.message || "Sector created successfully!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to create sector",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[createSector]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Update Sector
// ─────────────────────────────────────────────────────────────
export async function updateSector(
  id: string,
  _prevState: any,
  formData: FormData
) {
  try {
    const payload: Record<string, any> = {};

    ["name", "slug", "description", "icon", "color"].forEach((key) => {
      const value = formData.get(key);
      if (value !== null && value !== "") payload[key] = value;
    });

    if (formData.get("order") !== null) {
      payload.order = Number(formData.get("order"));
    }

    if (formData.get("isActive") !== null) {
      payload.isActive = formData.get("isActive") === "true";
    }

    const response = await serverFetch.patch(`/sectors/${id}`, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success) {
      revalidateTag("sectors-list", "max");
      revalidateTag(`sector-${id}`, "max");
      return {
        success: true,
        message: result.message || "Sector updated successfully!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to update sector",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[updateSector]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Delete Sector
// ─────────────────────────────────────────────────────────────
export async function deleteSector(id: string) {
  try {
    const response = await serverFetch.delete(`/sectors/${id}`);
    const result = await response.json();

    if (result.success) {
      revalidateTag("sectors-list", "max");
      revalidateTag("admin-dashboard", "max");
      return {
        success: true,
        message: result.message || "Sector deleted successfully!",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to delete sector",
    };
  } catch (error: any) {
    console.error("[deleteSector]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Join Sector
// ─────────────────────────────────────────────────────────────
export async function joinSector(id: string) {
  try {
    const response = await serverFetch.post(`/sectors/${id}/join`);
    const result = await response.json();

    if (result.success) {
      revalidateTag("sectors-list", "max");
      revalidateTag(`sector-${id}`, "max");
      revalidateTag("user-info", "max");
      return {
        success: true,
        message: result.message || "Joined sector successfully!",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to join sector",
    };
  } catch (error: any) {
    console.error("[joinSector]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Leave Sector
// ─────────────────────────────────────────────────────────────
export async function leaveSector(id: string) {
  try {
    const response = await serverFetch.delete(`/sectors/${id}/leave`);
    const result = await response.json();

    if (result.success) {
      revalidateTag("sectors-list", "max");
      revalidateTag(`sector-${id}`, "max");
      revalidateTag("user-info", "max");
      return {
        success: true,
        message: result.message || "Left sector successfully!",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to leave sector",
    };
  } catch (error: any) {
    console.error("[leaveSector]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Get Sector Members
// ─────────────────────────────────────────────────────────────
export async function getSectorMembers(id: string) {
  try {
    const response = await serverFetch.get(`/sectors/${id}/members`, {
      next: { tags: [`sector-${id}-members`] },
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to fetch members",
      data: [],
    };
  } catch (error: any) {
    console.error("[getSectorMembers]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
      data: [],
    };
  }
}
