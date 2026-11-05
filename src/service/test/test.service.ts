/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag, updateTag } from "next/cache";

const jsonHeaders = { "Content-Type": "application/json" };

const errMsg = (error: any, fallback: string) =>
  process.env.NODE_ENV === "development" ? error.message : fallback;

const toISO = (v: FormDataEntryValue | null) => {
  if (typeof v !== "string" || !v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

// Accepts repeated fields, a JSON array string, or a comma-separated string
const parseList = (formData: FormData, key: string): string[] => {
  const values = formData.getAll(key).filter((v): v is string => typeof v === "string");
  if (values.length === 0) return [];
  if (values.length === 1) {
    const raw = values[0].trim();
    if (!raw) return [];
    if (raw.startsWith("[")) {
      try {
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr.map(String).filter(Boolean) : [];
      } catch {
        return [];
      }
    }
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return values.map((s) => s.trim()).filter(Boolean);
};

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
      message: errMsg(error, "Something went wrong"),
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
      message: errMsg(error, "Something went wrong"),
      data: null,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Create Test
// formData: title, description, durationMinutes, passingMarks, startAt,
// endAt, shuffleQuestions, showResultImmediately, projectId, sectorId,
// targetType, memberIds, groups, questions (JSON string)
// ─────────────────────────────────────────────────────────────
export async function createTest(_prevState: any, formData: FormData) {
  try {
    // Questions: JSON string -> [{ questionText, type?, marks?, explanation?, options: [{ optionText, isCorrect }] }]
    let questions: any[] = [];
    const questionsRaw = formData.get("questions");
    if (typeof questionsRaw === "string" && questionsRaw) {
      try {
        const parsed = JSON.parse(questionsRaw);
        questions = Array.isArray(parsed) ? parsed : [];
      } catch {
        return {
          success: false,
          message: "Questions data is invalid",
          errors: { questions: "Invalid questions data" },
        };
      }
    }

    const title = ((formData.get("title") as string) || "").trim();
    if (!title) {
      return {
        success: false,
        message: "Test title is required",
        errors: { title: "Title is required" },
      };
    }

    // Validate questions (backend crashes on missing/empty ones)
    if (questions.length === 0) {
      return {
        success: false,
        message: "Add at least one question",
        errors: { questions: "Add at least one question" },
      };
    }
    for (const [i, q] of questions.entries()) {
      const n = i + 1;
      if (!q?.questionText?.toString().trim()) {
        return { success: false, message: `Question ${n}: text is required`, errors: {} };
      }
      const opts = Array.isArray(q.options) ? q.options : [];
      if (opts.length < 2 || opts.some((o: any) => !o?.optionText?.toString().trim())) {
        return {
          success: false,
          message: `Question ${n}: provide at least 2 options with text`,
          errors: {},
        };
      }
      if (!opts.some((o: any) => o.isCorrect === true)) {
        return {
          success: false,
          message: `Question ${n}: mark at least one correct option`,
          errors: {},
        };
      }
    }

    const projectId = (formData.get("projectId") as string) || undefined;
    const sectorId = (formData.get("sectorId") as string) || undefined;
    const memberIds = parseList(formData, "memberIds");
    const groups = parseList(formData, "groups");

    // Target type: use the selected one, otherwise infer from what was picked
    let targetType = (formData.get("targetType") as string) || "";
    if (!targetType) {
      if (projectId) targetType = "PROJECT_MEMBERS";
      else if (sectorId) targetType = "SECTOR_MEMBERS";
      else if (groups.length > 0) targetType = "SPECIFIC_GROUPS";
      else if (memberIds.length > 0) targetType = "SPECIFIC_MEMBERS";
      else targetType = "ALL_MEMBERS";
    }

    // Target validation
    if (targetType === "PROJECT_MEMBERS" && !projectId) {
      return { success: false, message: "Please select a project", errors: {} };
    }
    if (targetType === "SECTOR_MEMBERS" && !sectorId) {
      return { success: false, message: "Please select a sector", errors: {} };
    }
    if (targetType === "SPECIFIC_MEMBERS" && memberIds.length === 0) {
      return { success: false, message: "Select at least one member", errors: {} };
    }
    if (targetType === "SPECIFIC_GROUPS" && groups.length === 0) {
      return { success: false, message: "Select at least one group", errors: {} };
    }

    const startAt = toISO(formData.get("startAt"));
    const endAt = toISO(formData.get("endAt"));
    if (startAt && endAt && new Date(endAt) <= new Date(startAt)) {
      return {
        success: false,
        message: "End time must be after start time",
        errors: { endAt: "End time must be after start time" },
      };
    }

    const payload = {
      title,
      description: ((formData.get("description") as string) || "").trim() || undefined,
      durationMinutes: formData.get("durationMinutes")
        ? Number(formData.get("durationMinutes"))
        : undefined,
      passingMarks: formData.get("passingMarks")
        ? Number(formData.get("passingMarks"))
        : undefined,
      startAt,
      endAt,
      shuffleQuestions: formData.get("shuffleQuestions") !== "false",
      showResultImmediately: formData.get("showResultImmediately") !== "false",
      projectId,
      sectorId,
      targetType,
      memberIds: targetType === "SPECIFIC_MEMBERS" ? memberIds : undefined,
      groups: targetType === "SPECIFIC_GROUPS" ? groups : undefined,
      // totalMarks is calculated by the backend from the questions
      questions: questions.map((q) => ({
        questionText: q.questionText.toString().trim(),
        type: q.type || undefined,
        marks: Number(q.marks) > 0 ? Number(q.marks) : 1,
        explanation: q.explanation?.toString().trim() || undefined,
        options: q.options.map((o: any) => ({
          optionText: o.optionText.toString().trim(),
          isCorrect: o.isCorrect === true,
        })),
      })),
    };

    const response = await serverFetch.post("/tests", {
      body: JSON.stringify(payload),
      headers: jsonHeaders,
    });

    const result = await response.json();

    if (result.success) {
      updateTag("tests-list");
      updateTag("admin-dashboard");
      if (projectId) updateTag(`project-${projectId}`);
      return {
        success: true,
        message: result.message || "Test created successfully!",
        data: result.data,
      };
    }

    console.error("[createTest] backend rejected:", JSON.stringify(result));
    return {
      success: false,
      message: result.message || "Failed to create test",
      errors: result.errors || {},
    };
  } catch (error: any) {
    console.error("[createTest]", error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong. Please try again."),
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
    if (formData.get("startAt")) payload.startAt = toISO(formData.get("startAt"));
    if (formData.get("endAt")) payload.endAt = toISO(formData.get("endAt"));

    if (formData.get("shuffleQuestions") !== null) {
      payload.shuffleQuestions = formData.get("shuffleQuestions") === "true";
    }
    if (formData.get("showResultImmediately") !== null) {
      payload.showResultImmediately =
        formData.get("showResultImmediately") === "true";
    }

    const response = await serverFetch.patch(`/tests/${id}`, {
      body: JSON.stringify(payload),
      headers: jsonHeaders,
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
      message: errMsg(error, "Something went wrong. Please try again."),
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
      message: errMsg(error, "Something went wrong. Please try again."),
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
      message: errMsg(error, "Something went wrong. Please try again."),
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
      message: errMsg(error, "Something went wrong. Please try again."),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Submit Test Attempt
// Backend expects { answers: [{ questionId, selectedOptionIds }] }
// ─────────────────────────────────────────────────────────────
export async function submitTestAttempt(
  id: string,
  answers: Array<{ questionId: string; selectedOptions: string[] }>
) {
  try {
    const response = await serverFetch.post(`/tests/${id}/submit`, {
      body: JSON.stringify({
        answers: answers.map((a) => ({
          questionId: a.questionId,
          selectedOptionIds: a.selectedOptions,
        })),
      }),
      headers: jsonHeaders,
    });

    const result = await response.json();

    if (result.success) {
      revalidateTag(`test-${id}`, "max");
      revalidateTag(`test-${id}-attempt`, "max");
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
      message: errMsg(error, "Something went wrong. Please try again."),
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
      message: errMsg(error, "Something went wrong"),
      data: null,
    };
  }
}