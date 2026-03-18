import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined;
};

export const anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

if (process.env.NODE_ENV !== "production")
  globalForAnthropic.anthropic = anthropic;

export const MODEL = "claude-sonnet-4-20250514";

export async function generateStructured<T>(params: {
  system: string;
  prompt: string;
  schema: { name: string; description: string; schema: Record<string, unknown> };
  maxTokens?: number;
}): Promise<T> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: params.maxTokens ?? 4096,
    system: params.system,
    messages: [{ role: "user", content: params.prompt }],
    tools: [
      {
        name: params.schema.name,
        description: params.schema.description,
        input_schema: params.schema.schema as Anthropic.Tool["input_schema"],
      },
    ],
    tool_choice: { type: "tool", name: params.schema.name },
  });

  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("No structured output returned from Claude");
  }
  return toolBlock.input as T;
}

export async function generateText(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: params.maxTokens ?? 2048,
    system: params.system,
    messages: [{ role: "user", content: params.prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text output returned from Claude");
  }
  return textBlock.text;
}
