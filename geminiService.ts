import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AgentTask, PlanResponse } from "./types";

// ------------------------------------------------------------------
// ⚠️ SECURITY NOTE:
// Hardcoding keys exposes them to anyone who views your site's source code.
// Only do this for private/test deployments.
// ------------------------------------------------------------------
const HARDCODED_API_KEY = "AIzaSyDUHNIyOye12eFHqV1UXB_3sOvL4UQ4g24"; // <--- PASTE YOUR GEMINI API KEY HERE

const createClient = () => {
  let apiKey = HARDCODED_API_KEY;

  // Fallback: Try to retrieve from environment variables if a build system is used
  if (!apiKey) {
    try {
      // Check if process is defined (to avoid ReferenceError in browser)
      // @ts-ignore
      if (typeof process !== "undefined" && process.env) {
        // @ts-ignore
        apiKey = process.env.API_KEY;
      }
    } catch (e) {
      // process is not defined, ignore error
    }
  }

  if (!apiKey) {
    throw new Error("API_KEY is not set. Please paste your key into the HARDCODED_API_KEY variable in geminiService.ts");
  }

  return new GoogleGenAI({ apiKey });
};

/**
 * Step 1: Planning
 * Asks Gemini to break down the user's prompt into logical steps.
 */
export const generatePlan = async (userTopic: string): Promise<PlanResponse> => {
  const ai = createClient();
  
  const prompt = `
    You are an expert project manager and content strategist.
    The user wants to create a comprehensive piece of content about: "${userTopic}".
    
    Your goal is to break this request down into a detailed, step-by-step workflow.
    The workflow should mimic a professional content agency process.
    
    Required Steps Structure (Create 4-7 detailed steps):
    1. **Strategic Brief & Persona**: Define who the audience is and the core message.
    2. **Deep Research**: specific research tasks (e.g., searching for recent data, trends, or platform rules).
    3. **Structural Outline**: organizing the flow.
    4. **Content Drafting**: The actual writing phase (can be split into sections if the topic is large).
    5. **Review & Refinement**: Checking against constraints and polishing.
    
    For each step, provide:
    - A concise, action-oriented **title** (e.g., "Analyze Audience Persona", "Research 2025 AI Trends").
    - A detailed **description** of what this agent step will do.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      tasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["title", "description"]
        }
      }
    },
    required: ["tasks"]
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      systemInstruction: "You are a precise planning algorithm. Break down tasks logically.",
      thinkingConfig: { thinkingBudget: 2048 }
    },
  });

  const text = response.text;
  if (!text) throw new Error("No plan generated");
  
  return JSON.parse(text) as PlanResponse;
};

/**
 * Step 2: Execution
 * Executes a single step based on the plan and context from previous steps.
 * Returns a stream.
 */
export const executeStepStream = async (
  currentTask: AgentTask,
  allTasks: AgentTask[],
  userTopic: string
) => {
  const ai = createClient();

  // Gather context from previous completed tasks to maintain continuity
  const previousContext = allTasks
    .filter(t => t.status === 'COMPLETED' && t.resultContent)
    .map(t => `### Completed Step: ${t.title}\n${t.resultContent}`)
    .join("\n\n---\n\n");

  const prompt = `
    You are executing a specific step in a content generation workflow.
    
    **Global Goal**: Create content about "${userTopic}".
    
    **Context (Previous Steps)**:
    ${previousContext}

    **Current Step to Execute**:
    Title: ${currentTask.title}
    Description: ${currentTask.description}

    **Instructions**:
    1. Execute ONLY this specific step. Do not do the whole project.
    2. If this is a **Research** step, simulate searching and provide bullet points with data/facts.
    3. If this is a **Brief/Persona** step, define the target audience, tone, and key takeaways.
    4. If this is a **Writing** step, write the actual content sections requested.
    5. If this is a **Review** step, critique the previous content and provide a summary of quality checks.
    
    **Output Style**:
    - Use professional Markdown.
    - Use Bold for emphasis.
    - Use Lists for clarity.
    - If writing a draft, ensure it is high quality and flows well from the previous context.
  `;

  const responseStream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 0 } // Keep 0 for faster streaming feedback on execution
    }
  });

  return responseStream;
};