'use server'

import { db } from "@/firebase/admin";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { feedbackSchema } from "@/constants";

// If your project already defines these types elsewhere, keep them there.
// Shown here for clarity.
type SavedMessage = { role: "user" | "assistant" | "system"; content: string };
type CreateFeedbackParams = {
  interviewId: string;
  transcript: SavedMessage[];
  // new:
  idToken?: string;         // <- add this
  userId?: string;          // optional legacy fallback
};

export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null> {
  const interviews = await db
    .collection('interviews')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as Interview[];
}

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await db
    .collection('interviews')
    .orderBy('createdAt', 'desc')
    .where('finalized', '==', true)
    .where('userId', '!=', userId)
    .limit(limit)
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as Interview[];
}

export async function getInterviewsById(id: string): Promise<Interview | null> {
  const interview = await db.collection('interviews').doc(id).get();
  return interview.data() as Interview | null;
}

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, transcript, idToken, userId: userIdFromClient } = params;

  try {
    // --- derive userId on the server (preferred) ---
    let userId: string | undefined = userIdFromClient;
    if (idToken) {
      try {
        const decoded = await getAdminAuth().verifyIdToken(idToken);
        userId = decoded.uid;
      } catch (err) {
        console.error("ID token verification failed:", err);
        // optionally: return { success: false, error: "Auth failed" }
      }
    }

    if (!interviewId) {
      return { success: false, error: "Missing interviewId" };
    }
    if (!transcript || transcript.length === 0) {
      return { success: false, error: "Empty transcript" };
    }

    const formattedTranscript = transcript
      .map((s) => `- ${s.role}: ${String(s.content ?? "").replace(/\n+/g, " ").trim()}\n`)
      .join("");

    const {
      object: {
        totalScore,
        categoryScores,
        strengths,
        areasForImprovement,
        finalAssessment
      }
    } = await generateObject({
      model: google("gemini-2.0-flash", { structuredOutputs: false }),
      schema: feedbackSchema,
      prompt: `
You are an AI interviewer analyzing a mock interview. Be thorough and not lenient.
Transcript:
${formattedTranscript}

Please score ONLY the following categories (0–100):
- Communication Skills
- Technical Knowledge
- Problem-Solving
- Cultural & Role Fit
- Confidence & Clarity`,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories"
    });

    const feedback = await db.collection("feedback").add({
      interviewId,
      userId: userId ?? null, // stored from verified token when available
      totalScore,
      categoryScores,
      strengths,
      areasForImprovement,
      finalAssessment,
      createdAt: new Date().toISOString()
    });

    return { success: true, feedbackId: feedback.id };
  } catch (e) {
    console.error("Error saving feedback", e);
    return { success: false };
  }
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { userId, interviewId } = params;

  const feedback = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (feedback.empty) return null;

  const feedbackDoc = feedback.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}