import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SUMMARY_PROMPT = `You are a precise summarization assistant. Given the text below, do the following:

1. Summarize the content into **4-5 concise bullet points** using markdown formatting.
2. Each bullet point should capture a distinct key idea — no repetition.
3. At the end, add **1-4 relevant hashtags** that best represent the topic or theme of the text.

Respond ONLY in this format:

**Summary:**
- bullet point 1
- bullet point 2
- bullet point 3
- bullet point 4
- bullet point 5 (if needed)

**Tags:** #tag1 #tag2 #tag3

---
Text:
{{TEXT}}`;

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

    const prompt = SUMMARY_PROMPT.replace("{{TEXT}}", text);

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model ?? groqModel,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
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
    const summary = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ response: summary }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
