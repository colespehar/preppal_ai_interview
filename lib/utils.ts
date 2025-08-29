import { interviewCovers, mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { CreateWorkflowDTO } from "@vapi-ai/web/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const techIconBaseURL = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const normalizeTechName = (tech: string) => {
  const key = tech.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");
  return mappings[key as keyof typeof mappings];
};

const checkIconExists = async (url: string) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok; // Returns true if the icon exists
  } catch {
    return false;
  }
};

export const getTechLogos = async (techArray: string[]) => {
  const logoURLs = techArray.map((tech) => {
    const normalized = normalizeTechName(tech);
    return {
      tech,
      url: `${techIconBaseURL}/${normalized}/${normalized}-original.svg`,
    };
  });

  const results = await Promise.all(
    logoURLs.map(async ({ tech, url }) => ({
      tech,
      url: (await checkIconExists(url)) ? url : "/tech.svg",
    }))
  );

  return results;
};

export const getRandomInterviewCover = () => {
  const randomIndex = Math.floor(Math.random() * interviewCovers.length);
  return `/covers${interviewCovers[randomIndex]}`;
};

export const createWorkflow = (userId: string): CreateWorkflowDTO => {
  return {
    "name": "preppal-ai-interviewer",
    "nodes": [
      {
        "name": "introduction",
        "type": "conversation",
        "isStart": true,
        "metadata": {
          "position": {
            "x": -391.9393812035837,
            "y": -186.9098677680185
          }
        },
        "prompt": "Greet the user and help them create a new AI interviewer",
        "model": {
          "model": "gemini-2.0-flash",
          "provider": "google",
          "maxTokens": 250,
          "temperature": 0.3
        },
        "variableExtractionPlan": {
          "output": [
            {
              "enum": [
                "junior",
                "intermediate",
                "senior"
              ],
              "type": "string",
              "title": "level",
              "description": "Job experience level."
            },
            {
              "enum": [],
              "type": "number",
              "title": "amount",
              "description": "How many questions would you like to generate?"
            },
            {
              "enum": [],
              "type": "string",
              "title": "techstack",
              "description": "A list of technologies to cover during the job interview. For example, React, Next.js, Express.js, Node and so on…"
            },
            {
              "enum": [],
              "type": "string",
              "title": "role",
              "description": "What role should would you like to train for? For example Frontend, Backend, Fullstack, Design, UX?"
            },
            {
              "enum": [
                "behavioural",
                "problem solving",
                "technical",
                "mixed"
              ],
              "type": "string",
              "title": "type",
              "description": "What type of the interview should it be? Behavioural, problem solving, technical, or mixed."
            }
          ]
        },
        "messagePlan": {
          "firstMessage": "Hello, my name is Hana. \nI will be setting up your interview. \nI need to ask a few questions in order to tailer the interview exactly how you want. \nReady to begin?"
        },
        "toolIds": []
      },
      {
        "name": "hangup_1756248923113",
        "type": "tool",
        "metadata": {
          "position": {
            "x": -392.8545362679047,
            "y": 974.7812232019517
          }
        },
        "tool": {
          "type": "endCall",
          "function": {
            "name": "untitled_tool",
            "parameters": {
              "type": "object",
              "required": [],
              "properties": {}
            }
          },
          "messages": [
            {
              "type": "request-start",
              "content": "Everything has been generated. I will now redirect you to the dashboard. Thank you for the call!",
              "blocking": true
            }
          ]
        }
      },
      {
        "name": "conversation_1756391696120",
        "type": "conversation",
        "metadata": {
          "position": {
            "x": -393.5084119682966,
            "y": 331.89937318719757
          }
        },
        "prompt": "",
        "model": {
          "model": "gemini-2.5-flash",
          "provider": "google",
          "maxTokens": 250,
          "temperature": 0.3
        },
        "messagePlan": {
          "firstMessage": "The interview will be generate shortly."
        },
        "toolIds": []
      },
      {
        "name": "apiRequest_1756391978093",
        "type": "tool",
        "metadata": {
          "position": {
            "x": -393.1102451033426,
            "y": 678.6042468421704
          }
        },
        "tool": {
          "url": "https://preppal-ai-interview.vercel.app/api/vapi/generate",
          "body": {
            "type": "object",
            "required": [
              "role",
              "type",
              "level",
              "amount",
              "userid",
              "techstack"
            ],
            "properties": {
              "role": {
                "type": "string",
                "default": "{{role }}",
                "description": ""
              },
              "type": {
                "type": "string",
                "default": "{{type}}",
                "description": ""
              },
              "level": {
                "type": "string",
                "default": "{{level}}",
                "description": ""
              },
              "amount": {
                "type": "number",
                "default": "{{amount}}",
                "description": ""
              },
              "userid": {
                "type": "string",
                "default": "{{userid}}",
                "description": ""
              },
              "techstack": {
                "type": "string",
                "default": "{{techstack}}",
                "description": ""
              }
            }
          },
          "name": "getUserData",
          "type": "apiRequest",
          "method": "POST",
          "function": {
            "name": "api_request_tool",
            "parameters": {
              "type": "object",
              "required": [],
              "properties": {}
            },
            "description": "API request tool"
          },
          "messages": [
            {
              "type": "request-start",
              "content": "Please hold on. I am sending your request to the app.",
              "blocking": true
            },
            {
              "type": "request-failed",
              "content": "Oops! Looks like something went wrong when sending your data to the app. Please try again.",
              "endCallAfterSpokenEnabled": true
            },
            {
              "role": "assistant",
              "type": "request-complete",
              "content": "The request has been sent and your interview has been generated. Thank you for the call, good bye!",
              "endCallAfterSpokenEnabled": true
            }
          ],
          "variableExtractionPlan": {
            "schema": {
              "type": "object",
              "required": [],
              "properties": {}
            },
            "aliases": []
          }
        }
      }
    ],
    "edges": [
      {
        "from": "introduction",
        "to": "conversation_1756391696120",
        "condition": {
          "type": "ai",
          "prompt": "If user provided all the required variables"
        }
      },
      {
        "from": "conversation_1756391696120",
        "to": "apiRequest_1756391978093",
        "condition": {
          "type": "ai",
          "prompt": ""
        }
      },
      {
        "from": "apiRequest_1756391978093",
        "to": "hangup_1756248923113",
        "condition": {
          "type": "ai",
          "prompt": ""
        }
      }
    ],
    "voice": {
      "voiceId": "Hana",
      "provider": "vapi"
    },
    "globalPrompt": "You are a voice assistant helping with creating new AI interviewers. Your task is to collect data from the user. Remember that this is a voice conversation - do not use any special characters."
  }
}
