import Image from "next/image";
import React from "react";
import { cn } from "@/lib/utils";

enum CallStatus {
	INACTIVE = "INACTIVE",
	CONNECTING = "CONNECTING",
	ACTIVE = "ACTIVE",
	FINISHED = "FINISHED",
}

const agent = ({ userName }: AgentProps) => {
	const callStatus = CallStatus.ACTIVE;
	const isSpeaking = true;

	const handleDisconnect = () => {
		// setCallStatus(CallStatus.FINISHED);
		// vapi.stop();
	};

	const handleCall = () => {};
	return (
		<>
			<div className="call-view">
				<div className="card-interviewer">
					<div className="avatar">
						<Image
							src="/ai-avatar.png"
							alt="vapi"
							width={65}
							height={54}
							className="object-cover"
						/>
						{isSpeaking && <span className="animate-speak" />}
					</div>
					<h3>AI Interviewer</h3>
				</div>

				<div className="card-border">
					<div className="card-content">
						<Image
							src="/user-avatar.png"
							alt="user avatar"
							width={540}
							height={540}
							className="rounded-full object-cover size-[120px]"
						/>
						<h3>{userName}</h3>
					</div>
				</div>
			</div>
			<div className="w-full flex justify-center">
				{callStatus !== "ACTIVE" ? (
					<button className="relative btn-call" onClick={() => handleCall()}>
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
					<button>hi</button>
					// <button className="btn-disconnect" onClick={() => handleDisconnect()}>
					// 	End
					// </button>
				)}
			</div>
		</>
	);
};

export default agent;
