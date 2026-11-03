/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { zodValidator } from "@/lib/zodValidator";
import { revalidateTag } from "next/cache";
import { parseCookie } from "cookie";
import { changePasswordSchema } from "@/zod/auth.validation";
import { deleteCookie, getCookie, setCookie } from "./tokenHandlers";
import { verifyAccessToken } from "@/lib/jwtHanlders";

// ─────────────────────────────────────────────────────────────
// Get current user
// ─────────────────────────────────────────────────────────────
export async function getMe() {
  try {
    const response = await serverFetch.get("/auth/me", {
      next: { tags: ["user-info"], revalidate: 1800 },
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
      message: result.message || "Failed to fetch user info",
      data: null,
    };
  } catch (error: any) {
    console.error("[getMe]", error);
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
// Change password
// ─────────────────────────────────────────────────────────────
export async function changePasswordAction(
  _prevState: any,
  formData: FormData
) {
  try {
    const validationPayload = {
      oldPassword: formData.get("oldPassword") as string,
      newPassword: formData.get("newPassword") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const validated = zodValidator(validationPayload, changePasswordSchema);

    if (!validated.success) {
      return {
        success: false,
        message: "Validation failed. Please check the highlighted fields.",
        errors: validated.errors || {},
        formData: validationPayload,
      };
    }

    const response = await serverFetch.post("/auth/change-password", {
      body: JSON.stringify({
        oldPassword: validated.data!.oldPassword,
        newPassword: validated.data!.newPassword,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success) {
      revalidateTag("user-info", "max");
      return {
        success: true,
        message: result.message || "Password changed successfully!",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to change password",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[changePasswordAction]", error);
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
// Refresh access token (required by serverFetch)
// ─────────────────────────────────────────────────────────────
export async function getNewAccessToken() {
  try {
    const accessToken = await getCookie("accessToken");
    const refreshToken = await getCookie("refreshToken");

    if (!accessToken && !refreshToken) {
      return { tokenRefreshed: false };
    }

    if (accessToken) {
      const verified = await verifyAccessToken(accessToken);
      if (verified.success) {
        return { tokenRefreshed: false };
      }
    }

    if (!refreshToken) {
      return { tokenRefreshed: false };
    }

    const response = await serverFetch.post("/auth/refresh-token", {
      headers: {
        Cookie: `refreshToken=${refreshToken}`,
      },
    });

    const result = await response.json();
    const setCookieHeaders = response.headers.getSetCookie();

    if (!setCookieHeaders?.length) {
      throw new Error("No Set-Cookie header found");
    }

    let accessTokenObject: any = null;
    let refreshTokenObject: any = null;

    setCookieHeaders.forEach((cookieStr: string) => {
      const parsed = parseCookie(cookieStr);
      if (parsed["accessToken"]) accessTokenObject = parsed;
      if (parsed["refreshToken"]) refreshTokenObject = parsed;
    });

    if (!accessTokenObject || !refreshTokenObject) {
      throw new Error("Tokens not found in cookies");
    }

    await deleteCookie("accessToken");
    await setCookie("accessToken", accessTokenObject.accessToken, {
      secure: true,
      httpOnly: true,
      maxAge: parseInt(accessTokenObject["Max-Age"]) || 60 * 60 * 24,
      path: accessTokenObject.Path || "/",
      sameSite: (accessTokenObject["SameSite"] as any) || "lax",
    });

    await deleteCookie("refreshToken");
    await setCookie("refreshToken", refreshTokenObject.refreshToken, {
      secure: true,
      httpOnly: true,
      maxAge: parseInt(refreshTokenObject["Max-Age"]) || 60 * 60 * 24 * 30,
      path: refreshTokenObject.Path || "/",
      sameSite: (refreshTokenObject["SameSite"] as any) || "lax",
    });

    if (!result.success) {
      throw new Error(result.message || "Token refresh failed");
    }

    return {
      tokenRefreshed: true,
      success: true,
      message: "Token refreshed successfully",
    };
  } catch (error: any) {
    return {
      tokenRefreshed: false,
      success: false,
      message: error?.message || "Something went wrong",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────────────────────
export async function logoutAction() {
  try {
    await serverFetch.post("/auth/logout");
    await deleteCookie("accessToken");
    await deleteCookie("refreshToken");
    revalidateTag("user-info", "max");
    return { success: true, message: "Logged out successfully" };
  } catch (error: any) {
    await deleteCookie("accessToken");
    await deleteCookie("refreshToken");
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Logout completed locally",
    };
  }
}