/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";

// Helper: safely parse response body
async function safeJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return {
      ok: false as const,
      status: response.status,
      message: `Empty response (${response.status} ${response.statusText})`,
      data: null,
    };
  }

  try {
    const data = JSON.parse(text);
    return { ok: true as const, status: response.status, data };
  } catch {
    console.error("[safeJson] Invalid JSON:", text.slice(0, 300));
    return {
      ok: false as const,
      status: response.status,
      message: `Invalid JSON response (${response.status})`,
      data: null,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Get All Users
// ─────────────────────────────────────────────────────────────
export async function getAllUsers(query?: string) {
  try {
    const url = `/users${query ? `?${query}` : ""}`;
    console.log("[getAllUsers] url:", url);

    const response = await serverFetch.get(url, {
      next: { tags: ["users-list"] },
    });
    console.log("[getAllUsers] status:", response.status);

    const parsed = await safeJson(response);
    console.log("[getAllUsers] parsed:", JSON.stringify(parsed, null, 2));

    if (!parsed.ok) {
      return { success: false, message: parsed.message, data: [] };
    }

    const result = parsed.data;

    if (result?.success) {
      // handle common backend shapes: data[], data.users[], data.data[]
      const list = Array.isArray(result.data)
        ? result.data
        : result.data?.users ?? result.data?.data ?? [];

      return { success: true, data: list, meta: result.meta ?? result.data?.meta };
    }

    return {
      success: false,
      message: result?.message || "Failed to fetch users",
      data: [],
    };
  } catch (error: any) {
    console.error("[getAllUsers]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
      data: [],
    };
  }
}
// ─────────────────────────────────────────────────────────────
// Get Single User
// ─────────────────────────────────────────────────────────────
export async function getUserById(id: string) {
  try {
    const response = await serverFetch.get(`/users/${id}`, {
      next: { tags: [`user-${id}`] },
    });

    const parsed = await safeJson(response);

    if (!parsed.ok) {
      return {
        success: false,
        message: parsed.message,
        data: null,
      };
    }

    const result = parsed.data;

    if (result?.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      message: result?.message || "User not found",
      data: null,
    };
  } catch (error: any) {
    console.error("[getUserById]", error);
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
// Create User
// ─────────────────────────────────────────────────────────────
export async function createUser(_prevState: any, formData: FormData) {
  try {
    const payload = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: (formData.get("role") as string) || "MEMBER",
      phone: (formData.get("phone") as string) || undefined,
      roll: (formData.get("roll") as string) || undefined,
      semester: formData.get("semester")
        ? Number(formData.get("semester"))
        : undefined,
      shift: (formData.get("shift") as string) || undefined,
      group: (formData.get("group") as string) || undefined,
      registration: (formData.get("registration") as string) || undefined,
      bloodGroup: (formData.get("bloodGroup") as string) || undefined,
      presentAddress: (formData.get("presentAddress") as string) || undefined,
    };

    if (!payload.name || !payload.email) {
      return {
        success: false,
        message: "Name and email are required",
        errors: {
          name: !payload.name ? "Name is required" : undefined,
          email: !payload.email ? "Email is required" : undefined,
        },
      };
    }

    const response = await serverFetch.post("/users", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const parsed = await safeJson(response);

    if (!parsed.ok) {
      return {
        success: false,
        message: parsed.message,
      };
    }

    const result = parsed.data;

    if (result?.success) {
      revalidateTag("users-list", "max");
      revalidateTag("admin-dashboard", "max");
      return {
        success: true,
        message: result.message || "User created successfully!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result?.message || "Failed to create user",
      errors: result?.errors || {},
    };
  } catch (error: any) {
    console.error("[createUser]", error);
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
// Update User
// ─────────────────────────────────────────────────────────────
export async function updateUser(
  id: string,
  _prevState: any,
  formData: FormData
) {
  try {
    const payload: Record<string, any> = {};

    const fields = [
      "name",
      "email",
      "role",
      "status",
      "phone",
      "roll",
      "shift",
      "group",
      "registration",
      "bloodGroup",
      "presentAddress",
      "profilePicture",
    ];

    fields.forEach((key) => {
      const value = formData.get(key);
      if (value !== null && value !== "") {
        payload[key] = value;
      }
    });

    if (formData.get("semester")) {
      payload.semester = Number(formData.get("semester"));
    }

    const response = await serverFetch.patch(`/users/${id}`, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const parsed = await safeJson(response);

    if (!parsed.ok) {
      return {
        success: false,
        message: parsed.message,
      };
    }

    const result = parsed.data;

    if (result?.success) {
      revalidateTag("users-list", "max");
      revalidateTag(`user-${id}`, "max");
      revalidateTag("user-info", "max");
      return {
        success: true,
        message: result.message || "User updated successfully!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result?.message || "Failed to update user",
      errors: result?.errors || {},
    };
  } catch (error: any) {
    console.error("[updateUser]", error);
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
// Delete User
// ─────────────────────────────────────────────────────────────
export async function deleteUser(id: string) {
  try {
    const response = await serverFetch.delete(`/users/${id}`);
    const parsed = await safeJson(response);

    if (!parsed.ok) {
      return {
        success: false,
        message: parsed.message,
      };
    }

    const result = parsed.data;

    if (result?.success) {
      revalidateTag("users-list", "max");
      revalidateTag("admin-dashboard", "max");
      return {
        success: true,
        message: result.message || "User deleted successfully!",
      };
    }

    return {
      success: false,
      message: result?.message || "Failed to delete user",
    };
  } catch (error: any) {
    console.error("[deleteUser]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}