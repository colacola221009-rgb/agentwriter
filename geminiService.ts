import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AgentTask, PlanResponse } from "./types";

const createClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not set in environment variables");
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
    You are an expert content strategist and researcher.
    The user wants an article about: "${userTopic}".
    
    Break this task down into 4 to 6 logical steps to create a high-quality, researched article.
    
    Steps usually involve:
    1. Research/Analysis (Finding trends, facts)
    2. Outlining/Persona definition
    3. Drafting specific sections (Intro, Body, etc.)
    4. Review/Polishing
    
    Return a clear title and a short description for each task.
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
      systemInstruction: "You are a helpful planning agent.",
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
    .map(t => `Task: ${t.title}\nResult: ${t.resultContent}`)
    .join("\n\n---\n\n");

  const prompt = `
    User Topic: "${userTopic}"

    Context from previous steps:
    ${previousContext}

    Current Task to Execute:
    Title: ${currentTask.title}
    Description: ${currentTask.description}

    Instructions:
    Perform this task completely. 
    If it is a research task, provide detailed findings with simulated sources (e.g., [Xinhua], [Reuters]).
    If it is a writing task, write the actual content in Markdown format.
    If it is a review task, summarize the key points and checking against constraints.
    
    Output Format:
    Return ONLY the content for this step in Markdown. Use headers (##), bolding, and lists where appropriate to make it look like a professional report or article section.
  `;

  const responseStream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 0 } // Speed preferred for UI feedback, set >0 for complex reasoning if needed
    }
  });

  return responseStream;
};