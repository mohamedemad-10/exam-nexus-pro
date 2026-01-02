import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { topic, subject, grade, questionCount, questionTypes, includePassage } = await req.json();

    if (!topic) {
      return new Response(JSON.stringify({ error: 'Topic is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const count = questionCount || 10;
    const types = questionTypes || ['four_choice'];
    
    let questionTypesPrompt = '';
    if (types.includes('true_false')) {
      questionTypesPrompt += '- True/False questions: Use option_a="True" and option_b="False", leave option_c and option_d as empty strings "". correct_answer is "A" for True or "B" for False.\n';
    }
    if (types.includes('two_choice')) {
      questionTypesPrompt += '- Two-choice questions: Only use option_a and option_b, leave option_c and option_d as empty strings "". correct_answer is "A" or "B".\n';
    }
    if (types.includes('four_choice')) {
      questionTypesPrompt += '- Four-choice questions: Use all options option_a, option_b, option_c, option_d. correct_answer is "A", "B", "C", or "D".\n';
    }

    let passagePrompt = '';
    if (includePassage) {
      passagePrompt = `
Also generate a reading passage related to the topic. Some questions should be based on this passage.
Include the passage in the response as:
"passage": {
  "title": "Passage title here",
  "content": "Full passage text here (2-3 paragraphs)"
}
For questions that relate to the passage, make them comprehension-based.
`;
    }

    const prompt = `Generate an exam about "${topic}" for ${grade || 'general'} level students studying ${subject || 'general subject'}.

Create exactly ${count} questions with the following types:
${questionTypesPrompt}

${passagePrompt}

Respond with a valid JSON object only (no markdown, no code blocks):
{
  "title": "Exam title",
  "description": "Brief exam description",
  ${includePassage ? '"passage": { "title": "string", "content": "string" },' : ''}
  "questions": [
    {
      "question_text": "The question text",
      "option_a": "Option A text",
      "option_b": "Option B text", 
      "option_c": "Option C text or empty string for 2-choice/true-false",
      "option_d": "Option D text or empty string for 2-choice/true-false",
      "correct_answer": "A, B, C, or D",
      "question_type": "true_false, two_choice, or four_choice"
    }
  ]
}

Make questions challenging but appropriate for the level. Mix the question types as requested. Ensure correct_answer values are uppercase letters.`;

    console.log('Calling Lovable AI Gateway for exam generation...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert exam creator. Generate educational exam questions in valid JSON format only. No markdown, no code blocks, just pure JSON.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error('AI API error status:', status);
      
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content from AI:', aiResult);
      return new Response(JSON.stringify({ error: 'No response from AI' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('AI response received, parsing...');

    // Clean the response - remove markdown code blocks if present
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    let examData;
    try {
      examData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', cleanedContent.substring(0, 500));
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Exam generated successfully with', examData.questions?.length, 'questions');

    return new Response(JSON.stringify({
      title: examData.title || `${topic} Exam`,
      description: examData.description || `AI-generated exam about ${topic}`,
      passage: examData.passage || null,
      questions: examData.questions || [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in generate-exam:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
