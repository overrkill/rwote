import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const ANALYZE_PROMPT = `You are a precise note analyzer. Given the text below, extract actionable items and informational content.

Identify these 4 categories:

1. **DEADLINES** — Any dates, due dates, or time-sensitive items mentioned
2. **TODOS** — Tasks, action items, or things that need to be done
3. **FOLLOW_UPS** — Things that need follow-up, check-ins, or revisiting (with dates if mentioned)
4. **FLASH_CARDS** — Key facts, concepts, or definitions that could be turned into study flashcards (front = question/prompt, back = answer/explanation)

Analyze the text thoroughly. If a category has no items, return an empty array for it.

Respond ONLY in this JSON format (no markdown, no code blocks):
{
  "deadlines": [
    { "text": "description of deadline", "date": "specific date if mentioned" }
  ],
  "todos": [
    { "text": "action item description" }
  ],
  "followUps": [
    { "text": "follow-up description", "date": "specific date if mentioned" }
  ],
  "flashCards": [
    { "front": "question or prompt", "back": "answer or explanation" }
  ]
}

-----
{{TEXT}}
`;

Deno.serve(async (req) => {
  try {
    const groqModel = Deno.env.get("GROQ_MODEL") || "llama-3.1-8b-instant";
    const { text, model } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      return new Response(JSON.stringify({ error: "Groq API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = ANALYZE_PROMPT.replace("{{TEXT}}", text);

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model ?? groqModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(JSON.stringify({ error }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let result;
    try {
      const jsonStr = content || "";
      result = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error("Failed to parse JSON from Groq response:", e);
      result = content || "";
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analyze note error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
