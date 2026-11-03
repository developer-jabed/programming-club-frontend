/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";

// ─────────────────────────────────────────────────────────────
// Get All Tests
// ─────────────────────────────────────────────────────────────
export async function getAllTests(query?: string) {
  try {
    const response = await serverFetch.get(
      `/tests${query ? `?${query}` : ""}`,
      { next: { tags: ["tests-list"] } }
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
      message: result.message || "Failed to fetch tests",
      data: [],
    };
  } catch (error: any) {
    console.error("[getAllTests]", error);
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
// Get Single Test
// ─────────────────────────────────────────────────────────────
export async function getTestById(id: string) {
  try {
    const response = await serverFetch.get(`/tests/${id}`, {
      next: { tags: [`test-${id}`] },
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
      message: result.message || "Test not found",
      data: null,
    };
  } catch (error: any) {
    console.error("[getTestById]", error);
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
// Create Test
// ─────────────────────────────────────────────────────────────
export async function createTest(_prevState: any, formData: FormData) {
  try {
    // Questions can be sent as JSON string from the form
    let questions: any[] = [];
    const questionsRaw = formData.get("questions") as string;
    if (questionsRaw) {
      try {
        questions = JSON.parse(questionsRaw);
      } catch {
        questions = [];
      }
    }

    const payload = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      durationMinutes: formData.get("durationMinutes")
        ? Number(formData.get("durationMinutes"))
        : undefined,
      totalMarks: formData.get("totalMarks")
        ? Number(formData.get("totalMarks"))
        : 0,
      passingMarks: formData.get("passingMarks")
        ? Number(formData.get("passingMarks"))
        : undefined,
      startAt: (formData.get("startAt") as string) || undefined,
      endAt: (formData.get("endAt") as string) || undefined,
      shuffleQuestions: formData.get("shuffleQuestions") !== "false",
      showResultImmediately: formData.get("showResultImmediately") !== "false",
      projectId: (formData.get("projectId") as string) || undefined,
      sectorId: (formData.get("sectorId") as string) || undefined,
      targetType: (formData.get("targetType") as string) || "SPECIFIC_MEMBERS",
      questions,
    };

    if (!payload.title) {
      return {
        success: false,
        message: "Test title is required",
        errors: { title: "Title is required" },
      };
    }

    const response = await serverFetch.post("/tests", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success) {
      revalidateTag("tests-list", "max");
      revalidateTag("admin-dashboard", "max");
      return {
        success: true,
        message: result.message || "Test created successfully!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to create test",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[createTest]", error);
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
// Update Test
// ─────────────────────────────────────────────────────────────
export async function updateTest(
  id: string,
  _prevState: any,
  formData: FormData
) {
  try {
    const payload: Record<string, any> = {};

    ["title", "description", "status", "projectId", "sectorId", "targetType"].forEach(
      (key) => {
        const value = formData.get(key);
        if (value !== null && value !== "") payload[key] = value;
      }
    );

    if (formData.get("durationMinutes")) {
      payload.durationMinutes = Number(formData.get("durationMinutes"));
    }
    if (formData.get("totalMarks")) {
      payload.totalMarks = Number(formData.get("totalMarks"));
    }
    if (formData.get("passingMarks")) {
      payload.passingMarks = Number(formData.get("passingMarks"));
    }
    if (formData.get("startAt")) payload.startAt = formData.get("startAt");
    if (formData.get("endAt")) payload.endAt = formData.get("endAt");

    if (formData.get("shuffleQuestions") !== null) {
      payload.shuffleQuestions = formData.get("shuffleQuestions") === "true";
    }
    if (formData.get("showResultImmediately") !== null) {
      payload.showResultImmediately =
        formData.get("showResultImmediately") === "true";
    }

    const response = await serverFetch.patch(`/tests/${id}`, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success) {
      revalidateTag("tests-list", "max");
      revalidateTag(`test-${id}`, "max");
      return {
        success: true,
        message: result.message || "Test updated successfully!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to update test",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[updateTest]", error);
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
// Publish Test
// ─────────────────────────────────────────────────────────────
export async function publishTest(id: string) {
  try {
    const response = await serverFetch.patch(`/tests/${id}/publish`);
    const result = await response.json();

    if (result.success) {
      revalidateTag("tests-list", "max");
      revalidateTag(`test-${id}`, "max");
      return {
        success: true,
        message: result.message || "Test published successfully!",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to publish test",
    };
  } catch (error: any) {
    console.error("[publishTest]", error);
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
// Delete Test
// ─────────────────────────────────────────────────────────────
export async function deleteTest(id: string) {
  try {
    const response = await serverFetch.delete(`/tests/${id}`);
    const result = await response.json();

    if (result.success) {
      revalidateTag("tests-list", "max");
      revalidateTag("admin-dashboard", "max");
      return {
        success: true,
        message: result.message || "Test deleted successfully!",
      };
    }

    return {
      success: false,
      message: result.message || "Failed to delete test",
    };
  } catch (error: any) {
    console.error("[deleteTest]", error);
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
// Start Test Attempt
// ─────────────────────────────────────────────────────────────
export async function startTestAttempt(id: string) {
  try {
    const response = await serverFetch.post(`/tests/${id}/start`);
    const result = await response.json();

    if (result.success) {
      revalidateTag(`test-${id}`, "max");
      return {
        success: true,
        message: result.message || "Test started!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to start test",
    };
  } catch (error: any) {
    console.error("[startTestAttempt]", error);
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
// Submit Test Attempt
// ─────────────────────────────────────────────────────────────
export async function submitTestAttempt(
  id: string,
  answers: Array<{ questionId: string; selectedOptions: string[] }>
) {
  try {
    const response = await serverFetch.post(`/tests/${id}/submit`, {
      body: JSON.stringify({ answers }),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (result.success) {
      revalidateTag(`test-${id}`, "max");
      revalidateTag("tests-list", "max");
      revalidateTag("my-test-results", "max");
      return {
        success: true,
        message: result.message || "Test submitted successfully!",
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || "Failed to submit test",
    };
  } catch (error: any) {
    console.error("[submitTestAttempt]", error);
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
// Get My Attempt / Result
// ─────────────────────────────────────────────────────────────
export async function getMyTestAttempt(id: string) {
  try {
    const response = await serverFetch.get(`/tests/${id}/my-attempt`, {
      next: { tags: [`test-${id}-attempt`] },
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
      message: result.message || "Attempt not found",
      data: null,
    };
  } catch (error: any) {
    console.error("[getMyTestAttempt]", error);
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
