const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
export const NVIDIA_MODEL = "deepseek-ai/deepseek-v4-pro-0813";

export function hasNvidiaKey(): boolean {
  const key = (process.env.NVIDIA_API_KEY || "").trim();
  return key.length >= 20 && !/your[_-]?nvidia|placeholder|here$/i.test(key);
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function generateNvidiaResponse(messages: ChatMessage[]): Promise<string> {
  const apiKey = (process.env.NVIDIA_API_KEY || "").trim();
  if (!hasNvidiaKey()) throw new Error("NVIDIA_API_KEY is not configured.");

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.NVIDIA_MODEL || NVIDIA_MODEL,
      messages,
      temperature: 0.3,
      top_p: 0.95,
      max_tokens: 4096,
      stream: false,
      chat_template_kwargs: { thinking: false },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`NVIDIA API request failed (${response.status}): ${detail.slice(0, 500)}`);
  }
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("NVIDIA API returned no response content.");
  return content;
}
