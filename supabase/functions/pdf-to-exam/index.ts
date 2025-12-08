import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization")?.split(" ")[1];
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(authHeader);
    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if requesting user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { pdfBase64, pdfText, examTitle, examDescription } = await req.json();

    // Check if we have either base64 or text
    const textContent = pdfBase64 || pdfText;
    
    if (!textContent) {
      return new Response(JSON.stringify({ error: "PDF content is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Processing PDF content, type:", pdfBase64 ? "base64" : "text");

    const systemPrompt = `You are an expert exam creator. Analyze the provided content and extract or generate multiple-choice questions from it.

For each question:
1. Create a clear, well-formed question
2. Provide exactly 4 options (A, B, C, D)
3. Identify the correct answer
4. If the text contains passages or reading comprehension sections, group related questions together

Return your response as a valid JSON object with this exact structure:
{
  "questions": [
    {
      "question_text": "The question here",
      "option_a": "First option",
      "option_b": "Second option", 
      "option_c": "Third option",
      "option_d": "Fourth option",
      "correct_answer": "A",
      "passage": "Optional passage text if this is a reading comprehension question"
    }
  ]
}

Important:
- Extract as many relevant questions as possible from the content
- For math questions, format them clearly
- For passage-based questions, include the relevant passage text
- Ensure all questions have exactly 4 options
- The correct_answer must be A, B, C, or D
- Return ONLY the JSON object, no other text
- If the content appears to be binary/encoded, try to extract any visible text patterns`;

    // Use gemini-2.5-flash for document analysis
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: pdfBase64 
              ? `This is a PDF document encoded in base64. Please analyze it and extract exam questions:\n\n${textContent.substring(0, 100000)}`
              : `Extract questions from this content:\n\n${textContent.substring(0, 50000)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service quota exceeded. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      return new Response(JSON.stringify({ error: "No response from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("AI response received, length:", aiContent.length);

    // Parse the JSON from AI response
    let parsedQuestions;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedQuestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.error("AI content preview:", aiContent.substring(0, 500));
      return new Response(JSON.stringify({ error: "Failed to parse AI response. Try with a different PDF." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Extracted questions count:", parsedQuestions.questions?.length);

    return new Response(JSON.stringify({ 
      success: true, 
      questions: parsedQuestions.questions || [],
      suggestedTitle: examTitle || "Extracted Exam",
      suggestedDescription: examDescription || "Questions extracted from PDF"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in pdf-to-exam function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});