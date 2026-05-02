import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SUMMARY_PROMPT = `You are a precise summarization assistant. Given the text below, do the following:

1. Summarize the content into **4-5 concise bullet points**.
2. Each bullet point should capture a distinct key idea — no repetition.
3. Extract **1-4 relevant hashtags** that best represent the topic or theme of the text.

Respond ONLY in this JSON format (no markdown, no code blocks):
{
  "summary": "A brief 2-3 sentence summary of the text",
  "keyPoints": ["key point 1", "key point 2", "key point 3", "key point 4"],
  "tags":["tag1","tag2","tag3","tag4"]
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

    const prompt = SUMMARY_PROMPT.replace("{{TEXT}}", text);
    const originalWordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;

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
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    let result;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonStr = content || "";
      result = JSON.parse(jsonStr.trim());
    } catch (e) {
      // If JSON parsing fails, create a structured response from the raw text
      console.error("Failed to parse JSON from Groq response:", e);
      result = content || "";
    }

    // Ensure all fields exist
    const responseBody = result;

    console.log("Summarize response:", responseBody);

    return new Response(JSON.stringify(responseBody), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Summarize error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
