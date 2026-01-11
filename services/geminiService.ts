
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectPlan } from "../types";

export const decomposeTask = async (
  prompt: string, 
  budgetMNEE: number, 
  companyName: string, 
  clientWallet: string
): Promise<ProjectPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are the 'MNEE Agent-Relay' Orchestrator. 
    You decompose complex tasks for a company into 3-5 sub-tasks for specialized AI agents.
    Budget is in MNEE (6 decimals). 
    Total task costs must be 15% lower than the budget (agent margin).
    Output strictly JSON.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze task: "${prompt}" for Company: "${companyName}" (Wallet: ${clientWallet}). Total budget: ${budgetMNEE} MNEE.`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          projectName: { type: Type.STRING },
          totalBudget: { type: Type.NUMBER },
          estimatedMargin: { type: Type.NUMBER },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                agentType: { type: Type.STRING },
                costMNEE: { type: Type.NUMBER },
                status: { type: Type.STRING },
                revisionCount: { type: Type.NUMBER }
              },
              required: ["id", "name", "description", "agentType", "costMNEE", "status", "revisionCount"]
            }
          }
        },
        required: ["projectName", "totalBudget", "estimatedMargin", "tasks"]
      }
    }
  });

  const jsonStr = response.text?.trim() || "{}";
  const parsed = JSON.parse(jsonStr);
  
  return {
    ...parsed,
    companyName,
    clientWallet,
    remainingBudget: budgetMNEE
  };
};
