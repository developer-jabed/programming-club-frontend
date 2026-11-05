/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { updateTag } from "next/cache";

const jsonHeaders = { "Content-Type": "application/json" };
const MIN_PASSWORD = 6;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const errMsg = (error: any, fallback: string) =>
  process.env.NODE_ENV === "development" ? error.message : fallback;

// Safely parse a response body (empty or non-JSON bodies don't throw)
async function safeJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return {
      ok: false as const,
      message: `Empty response (${response.status} ${response.statusText})`,
      data: null,
    };
  }

  try {
    return { ok: true as const, data: JSON.parse(text) };
  } catch {
    console.error("[safeJson] Invalid JSON:", text.slice(0, 300));
    return {
      ok: false as const,
      message: `Invalid JSON response (${response.status})`,
      data: null,
    };
  }
}

const str = (formData: FormData, key: string) => {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
};

// Immediate invalidation (read-your-own-writes)
const refresh = (...tags: string[]) => tags.forEach((t) => updateTag(t));

// Returns the uploaded picture (if any) from the form. Empty file inputs are ignored.
function getPictureFile(formData: FormData): File | null {
  const f = formData.get("profilePicture");
  if (f instanceof File && f.size > 0) return f;
  return null;
}

function validatePicture(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPG, PNG or WebP images are allowed";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "Image must be 5MB or smaller";
  }
  return null;
}

// Multipart body: JSON fields in `data`, image in `file`.
// Do NOT set Content-Type manually: fetch adds the multipart boundary itself.
function buildMultipartBody(payload: Record<string, any>, file: File | null) {
  const body = new FormData();
  body.append("data", JSON.stringify(payload));
  if (file) body.append("file", file, file.name);
  return body;
}

// ─────────────────────────────────────────────────────────────
// Get All Users
// Query supports: searchTerm, role, status, group, semester, shift,
// page, limit, sortBy, sortOrder
// ─────────────────────────────────────────────────────────────
export async function getAllUsers(query?: string) {
  try {
    const response = await serverFetch.get(`/users${query ? `?${query}` : ""}`, {
      next: { tags: ["users-list"] },
    });

    const parsed = await safeJson(response);
    if (!parsed.ok) {
      return { success: false, message: parsed.message, data: [] };
    }

    const result = parsed.data;
    if (result?.success) {
      // handle common backend shapes: data[], data.users[], data.data[]
      const list = Array.isArray(result.data)
        ? result.data
        : result.data?.users ?? result.data?.data ?? [];

      return {
        success: true,
        data: list,
        meta: result.meta ?? result.data?.meta,
      };
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
      message: errMsg(error, "Something went wrong"),
      data: [],
    };
  }
}

// Lightweight list for pickers (e.g. "specific members" on tests/tasks)
export async function getMemberOptions() {
  const res = await getAllUsers(
    "limit=200&status=ACTIVE&role=MEMBER&sortBy=name&sortOrder=asc"
  );
  const members: { id: string; name: string; email?: string }[] = res.success
    ? (res.data as any[]).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
      }))
    : [];
  return { success: res.success, data: members };
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
      return { success: false, message: parsed.message, data: null };
    }

    const result = parsed.data;
    if (result?.success) {
      return { success: true, data: result.data };
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
      message: errMsg(error, "Something went wrong"),
      data: null,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Create User
// formData: name*, email*, password*, role, phone, roll, semester, shift,
// group, registration, bloodGroup, presentAddress,
// profilePicture (File input, optional)
// ─────────────────────────────────────────────────────────────
export async function createUser(_prevState: any, formData: FormData) {
  try {
    const name = str(formData, "name");
    const email = str(formData, "email").toLowerCase();
    const password = (formData.get("password") as string) || "";

    const errors: Record<string, string> = {};
    if (!name) errors.name = "Name is required";
    if (!email) errors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email";
    if (!password) errors.password = "Password is required";
    else if (password.length < MIN_PASSWORD)
      errors.password = `Password must be at least ${MIN_PASSWORD} characters`;

    const semesterRaw = str(formData, "semester");
    let semester: number | undefined;
    if (semesterRaw) {
      semester = Number(semesterRaw);
      if (!Number.isInteger(semester) || semester < 1)
        errors.semester = "Semester must be a whole number";
    }

    const picture = getPictureFile(formData);
    if (picture) {
      const pictureError = validatePicture(picture);
      if (pictureError) errors.profilePicture = pictureError;
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: Object.values(errors)[0],
        errors,
      };
    }

    const payload = {
      name,
      email,
      password,
      role: str(formData, "role") || "MEMBER",
      phone: str(formData, "phone") || undefined,
      roll: str(formData, "roll") || undefined,
      semester,
      shift: str(formData, "shift") || undefined,
      group: str(formData, "group") || undefined,
      registration: str(formData, "registration") || undefined,
      bloodGroup: str(formData, "bloodGroup") || undefined,
      presentAddress: str(formData, "presentAddress") || undefined,
    };

    const response = await serverFetch.post("/users", {
      body: buildMultipartBody(payload, picture),
    });

    const parsed = await safeJson(response);
    if (!parsed.ok) {
      return { success: false, message: parsed.message };
    }

    const result = parsed.data;
    if (result?.success) {
      refresh("users-list", "admin-dashboard");
      return {
        success: true,
        message: result.message || "User created successfully!",
        data: result.data,
      };
    }

    console.error("[createUser] backend rejected:", JSON.stringify(result));
    return {
      success: false,
      message: result?.message || "Failed to create user",
      errors: result?.errors || {},
    };
  } catch (error: any) {
    console.error("[createUser]", error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong. Please try again."),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Update User
// Only fields present in formData are sent. For optional fields, an empty
// value clears the field (null). name/email/role/status are never cleared.
// Picture: send a File in `profilePicture` to replace it, or
// `removeProfilePicture=true` to clear it.
// ─────────────────────────────────────────────────────────────
export async function updateUser(
  id: string,
  _prevState: any,
  formData: FormData
) {
  try {
    const payload: Record<string, any> = {};

    // Required fields: send only when non-empty
    for (const key of ["name", "email", "role", "status"]) {
      if (!formData.has(key)) continue;
      const v = str(formData, key);
      if (!v) {
        return {
          success: false,
          message: `${key[0].toUpperCase()}${key.slice(1)} cannot be empty`,
          errors: { [key]: "This field is required" },
        };
      }
      payload[key] = key === "email" ? v.toLowerCase() : v;
    }

    if (payload.email && !/^\S+@\S+\.\S+$/.test(payload.email)) {
      return {
        success: false,
        message: "Enter a valid email",
        errors: { email: "Enter a valid email" },
      };
    }

    // Optional text fields: empty -> null (clears the value)
    for (const key of [
      "phone",
      "roll",
      "shift",
      "group",
      "registration", // unique: must be null, never "", when cleared
      "bloodGroup",
      "presentAddress",
    ]) {
      if (formData.has(key)) payload[key] = str(formData, key) || null;
    }

    if (formData.has("semester")) {
      const s = str(formData, "semester");
      if (!s) {
        payload.semester = null;
      } else {
        const n = Number(s);
        if (!Number.isInteger(n) || n < 1) {
          return {
            success: false,
            message: "Semester must be a whole number",
            errors: { semester: "Semester must be a whole number" },
          };
        }
        payload.semester = n;
      }
    }

    // Profile picture: new file wins; otherwise optional removal
    const picture = getPictureFile(formData);
    if (picture) {
      const pictureError = validatePicture(picture);
      if (pictureError) {
        return {
          success: false,
          message: pictureError,
          errors: { profilePicture: pictureError },
        };
      }
    } else if (str(formData, "removeProfilePicture") === "true") {
      payload.profilePicture = null;
    }

    // Optional password change
    const password = (formData.get("password") as string) || "";
    if (password) {
      if (password.length < MIN_PASSWORD) {
        return {
          success: false,
          message: `Password must be at least ${MIN_PASSWORD} characters`,
          errors: { password: "Password too short" },
        };
      }
      payload.password = password;
    }

    if (Object.keys(payload).length === 0 && !picture) {
      return { success: false, message: "Nothing to update", errors: {} };
    }

    const response = await serverFetch.patch(`/users/${id}`, {
      body: buildMultipartBody(payload, picture),
    });

    const parsed = await safeJson(response);
    if (!parsed.ok) {
      return { success: false, message: parsed.message };
    }

    const result = parsed.data;
    if (result?.success) {
      refresh("users-list", `user-${id}`, "user-info", "admin-dashboard");
      return {
        success: true,
        message: result.message || "User updated successfully!",
        data: result.data,
      };
    }

    console.error("[updateUser] backend rejected:", JSON.stringify(result));
    return {
      success: false,
      message: result?.message || "Failed to update user",
      errors: result?.errors || {},
    };
  } catch (error: any) {
    console.error("[updateUser]", error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong. Please try again."),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Set status (activate / deactivate) without a form
// (JSON only, no file needed)
// ─────────────────────────────────────────────────────────────
export async function setUserStatus(id: string, status: string) {
  try {
    const response = await serverFetch.patch(`/users/${id}`, {
      body: JSON.stringify({ status }),
      headers: jsonHeaders,
    });

    const parsed = await safeJson(response);
    if (!parsed.ok) {
      return { success: false, message: parsed.message };
    }

    const result = parsed.data;
    if (result?.success) {
      refresh("users-list", `user-${id}`, "admin-dashboard");
      return { success: true, message: "Status updated" };
    }

    return {
      success: false,
      message: result?.message || "Failed to update status",
    };
  } catch (error: any) {
    console.error("[setUserStatus]", error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong. Please try again."),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Delete User (backend soft-deletes: status -> INACTIVE)
// ─────────────────────────────────────────────────────────────
export async function deleteUser(id: string) {
  try {
    const response = await serverFetch.delete(`/users/${id}`);
    const parsed = await safeJson(response);

    if (!parsed.ok) {
      return { success: false, message: parsed.message };
    }

    const result = parsed.data;
    if (result?.success) {
      refresh("users-list", `user-${id}`, "admin-dashboard");
      return {
        success: true,
        message: result.message || "User deactivated successfully!",
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
      message: errMsg(error, "Something went wrong. Please try again."),
    };
  }
}