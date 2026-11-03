/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";

// ─────────────────────────────────────────────────────────────
// Get Project Messages
// ─────────────────────────────────────────────────────────────
export async function getProjectMessages(projectId: string, query?: string) {
  try {
    const response = await serverFetch.get(
      `/chat/${projectId}/messages${query ? `?${query}` : ""}`,
      { next: { tags: [`chat-${projectId}`] } }
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
      message: result.message || "Failed to fetch messages",
      data: [],
    };
  } catch (error: any) {
    console.error("[getProjectMessages]", error);
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
// Send Message
// ─────────────────────────────────────────────────────────────
export async function sendMessage(
  projectId: string,
  _prevState: any,
  formData: FormData
) {
  try {
    const attachmentsRaw = formData.get("attachments") as string;
    const attachments = attachmentsRaw
      ? attachmentsRaw.split(",").map((u) => u.trim()).filter(Boolean)
      : [];

    const payload = {
      content: formData.get("content") as string,
      replyToId: (formData.get("replyToId") as string) || undefined,
      attachments,
    };

    if (!payload.content?.trim()) {
      return {
        success: false,
        message: "Message content is required",
        errors: { content: "Content is required" },
      };
    }

    const response = await serverFetch.post(
      `/chat/${projectId}/messages`,
      {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }
    );

    const result = await response.json();

    if (result.success) {
      revalidateTag(`chat-${projectId}`, "max");
      return {
        success: true,
        message: result.message || "Message sent!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to send message",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[sendMessage]", error);
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
// Delete Message
// ─────────────────────────────────────────────────────────────
export async function deleteMessage(messageId: string, projectId: string) {
  try {
    const response = await serverFetch.delete(
      `/chat/messages/${messageId}`
    );
    const result = await response.json();

    if (result.success) {
      revalidateTag(`chat-${projectId}`, "max");
      return {
        success: true,
        message: result.message || "Message deleted!",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to delete message",
    };
  } catch (error: any) {
    console.error("[deleteMessage]", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}
