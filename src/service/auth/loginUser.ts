/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import {
  getDefaultDashboardRoute,
  isValidRedirectForRole,
  UserRole,
} from "@/lib/auth-utils";
import { serverFetch } from "@/lib/server-fetch";
import { zodValidator } from "@/lib/zodValidator";
import { parseCookie } from "cookie";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redirect } from "next/navigation";
import { setCookie } from "./tokenHandlers";
import { loginValidationZodSchema } from "@/zod/auth.validation";

export const loginUser = async (
  _currentState: any,
  formData: FormData
): Promise<any> => {
  try {
    const redirectTo = formData.get("redirect") as string | null;

    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const validation = zodValidator(payload, loginValidationZodSchema);

    if (!validation.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: validation.errors,
        formData: payload,
      };
    }

    const validatedPayload = validation.data;

    const res = await serverFetch.post("/auth/login", {
      body: JSON.stringify(validatedPayload),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await res.json();

    if (!result.success) {
      return {
        success: false,
        message: result.message || "Login failed",
      };
    }

    const setCookieHeaders = res.headers.getSetCookie();

    if (!setCookieHeaders || setCookieHeaders.length === 0) {
      throw new Error("No Set-Cookie header found");
    }

    let accessTokenObject: any = null;
    let refreshTokenObject: any = null;

    setCookieHeaders.forEach((cookieStr: string) => {
      const parsedCookie = parseCookie(cookieStr);
      if (parsedCookie["accessToken"]) accessTokenObject = parsedCookie;
      if (parsedCookie["refreshToken"]) refreshTokenObject = parsedCookie;
    });

    if (!accessTokenObject || !refreshTokenObject) {
      throw new Error("Tokens not found in response cookies");
    }

    await setCookie("accessToken", accessTokenObject.accessToken, {
      secure: true,
      httpOnly: true,
      maxAge: Number(accessTokenObject["Max-Age"]) || 60 * 60 * 24,
      path: accessTokenObject.Path || "/",
      sameSite: (accessTokenObject["SameSite"] as any) || "lax",
    });

    await setCookie("refreshToken", refreshTokenObject.refreshToken, {
      secure: true,
      httpOnly: true,
      maxAge: Number(refreshTokenObject["Max-Age"]) || 60 * 60 * 24 * 90,
      path: refreshTokenObject.Path || "/",
      sameSite: (refreshTokenObject["SameSite"] as any) || "lax",
    });

    const verifiedToken = jwt.verify(
      accessTokenObject.accessToken,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    if (typeof verifiedToken === "string" || !verifiedToken.role) {
      throw new Error("Invalid token");
    }

    const userRole = verifiedToken.role as UserRole;

    if (redirectTo) {
      const requestedPath = redirectTo.toString();
      if (isValidRedirectForRole(requestedPath, userRole)) {
        redirect(`${requestedPath}?loggedIn=true`);
      }
    }

    redirect(`${getDefaultDashboardRoute(userRole)}?loggedIn=true`);
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("[loginUser]", error);

    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Login failed. Please check your email or password.",
    };
  }
};