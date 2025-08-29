"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/client";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
	INACTIVE = "INACTIVE",
	CONNECTING = "CONNECTING",
	ACTIVE = "ACTIVE",
	FINISHED = "FINISHED",
}

interface SavedMessage {
	role: "user" | "system" | "assistant";
	content: string;
}

const Agent = ({
	userName,
	userId,
	interviewId,
	feedbackId,
	type,
	questions,
}: AgentProps) => {
	const router = useRouter();
	const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
	const [messages, setMessages] = useState<SavedMessage[]>([]);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [lastMessage, setLastMessage] = useState<string>("");
	const [idToken, setIdToken] = useState<string | null>(null); // <-- token state

	// Keep Firebase auth state & token in sync
	useEffect(() => {
		const unsub = onAuthStateChanged(auth, async (user) => {
			if (user) {
				const token = await user.getIdToken(/* forceRefresh? false */);
				setIdToken(token);
			} else {
				setIdToken(null);
			}
		});
		return () => unsub();
	}, []);

	// Wire up Vapi events
	useEffect(() => {
		const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
		const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const onMessage = (msg: any) => {
			if (msg?.type !== "transcript") return;

			const isFinal =
				msg.transcriptType === "final" ||
				msg.transcriptType === "user_final" ||
				msg.transcriptType === "assistant_final" ||
				msg.isFinal === true;

			if (!isFinal) return;

			const text =
				msg.transcript ??
				msg.text ??
				(typeof msg.content === "string" ? msg.content : "");
			if (!text) return;

			const role =
				msg.role === "user" || msg.role === "assistant" || msg.role === "system"
					? msg.role
					: msg.role === "agent"
					? "assistant"
					: "user";

			setMessages((prev) => [...prev, { role, content: text }]);
		};

		const onSpeechStart = () => setIsSpeaking(true);
		const onSpeechEnd = () => setIsSpeaking(false);
		const onError = (e: Error) => console.error("Vapi error:", e);

		vapi.on("call-start", onCallStart);
		vapi.on("call-end", onCallEnd);
		vapi.on("message", onMessage);
		vapi.on("speech-start", onSpeechStart);
		vapi.on("speech-end", onSpeechEnd);
		vapi.on("error", onError);

		return () => {
			vapi.off("call-start", onCallStart);
			vapi.off("call-end", onCallEnd);
			vapi.off("message", onMessage);
			vapi.off("speech-start", onSpeechStart);
			vapi.off("speech-end", onSpeechEnd);
			vapi.off("error", onError);
		};
	}, []);

	// Handle transcript updates + finish flow
	useEffect(() => {
		if (messages.length > 0) {
			setLastMessage(messages[messages.length - 1].content);
		}

		const handleGenerateFeedback = async (msgs: SavedMessage[]) => {
			const { success, feedbackId: id } = await createFeedback({
				interviewId: interviewId!,
				transcript: msgs.map((m) => ({
					role: m.role,
					content: String(m.content || ""),
				})),
				idToken: idToken ?? undefined, // <-- send token (server derives userId)
				// userId: userId!,             // optional legacy; server should prefer idToken
				feedbackId,
			});

			if (success && id) {
				router.push(`/interview/${interviewId}/feedback`);
			} else {
				console.log("Error saving feedback");
				router.push("/");
			}
		};

		if (callStatus === CallStatus.FINISHED) {
			if (type === "generate") {
				router.push("/");
			} else {
				handleGenerateFeedback(messages);
			}
		}
	}, [
		messages,
		callStatus,
		feedbackId,
		interviewId,
		router,
		type,
		idToken,
		userId,
	]);

	const handleCall = async () => {
		setCallStatus(CallStatus.CONNECTING);

		if (type === "generate") {
			await vapi.start(
				undefined,
				{
					variableValues: {
						username: String(userName ?? ""),
						userid: String(userId ?? ""),
					},
					clientMessages: ["transcript"],
					serverMessages: ["transcript"],
				},
				undefined,
				process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!
			);
		} else {
			const formattedQuestions = (questions ?? [])
				.map((q) => `- ${q}`)
				.join("\n");
			await vapi.start(interviewer, {
				variableValues: { questions: formattedQuestions },
				clientMessages: ["transcript"],
				serverMessages: ["transcript"],
			});
		}
	};

	const handleDisconnect = () => {
		setCallStatus(CallStatus.FINISHED);
		vapi.stop();
	};

	return (
		<>
			<div className="call-view">
				{/* AI Interviewer Card */}
				<div className="card-interviewer">
					<div className="avatar">
						<Image
							src="/ai-avatar-test.png"
							alt="profile-image"
							width={65}
							height={54}
							className="object-cover"
						/>
						{isSpeaking && <span className="animate-speak" />}
					</div>
					<h3>AI Interviewer</h3>
				</div>

				{/* User Profile Card */}
				<div className="card-border">
					<div className="card-content">
						<Image
							src="/user-avatar.png"
							alt="profile-image"
							width={539}
							height={539}
							className="rounded-full object-cover size-[120px]"
						/>
						<h3>{userName}</h3>
					</div>
				</div>
			</div>

			{messages.length > 0 && (
				<div className="transcript-border">
					<div className="transcript">
						<p
							key={lastMessage}
							className={cn(
								"transition-opacity duration-500 opacity-0",
								"animate-fadeIn opacity-100"
							)}
						>
							{lastMessage}
						</p>
					</div>
				</div>
			)}

			<div className="w-full flex justify-center">
				{callStatus !== "ACTIVE" ? (
					<button className="relative btn-call" onClick={handleCall}>
						<span
							className={cn(
								"absolute animate-ping rounded-full opacity-75",
								callStatus !== "CONNECTING" && "hidden"
							)}
						/>
						<span className="relative">
							{callStatus === "INACTIVE" || callStatus === "FINISHED"
								? "Call"
								: ". . ."}
						</span>
					</button>
				) : (
					<button className="btn-disconnect" onClick={handleDisconnect}>
						End
					</button>
				)}
			</div>
		</>
	);
};

export default Agent;
