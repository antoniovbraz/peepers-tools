import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, authenticate, errorResponse, handleAIError, sanitizeForLLM, LLM_SAFETY_INSTRUCTION, createRequestLogger } from "../_shared/helpers.ts";

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await authenticate(req, cors);
    if (auth instanceof Response) return auth;

    const { prompt, referencePhotos, feedback } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.length > 5000) {
      return errorResponse("Prompt inválido", 400, cors);
    }
    if (referencePhotos && !Array.isArray(referencePhotos)) {
      return errorResponse("Fotos de referência inválidas", 400, cors);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contentParts: any[] = [];
    const photos = (referencePhotos || []).slice(0, 3);
    if (photos.length > 0) {
      contentParts.push({
        type: "text",
        text: `${LLM_SAFETY_INSTRUCTION}\n\nHere are reference photos of the ACTUAL product.

FIDELITY RULES (MANDATORY — NEVER VIOLATE):
- Use the EXACT product from these reference photos
- Do not change: shape, proportions, dimensions, materials, colors, textures, button placement, ports, layout, logos, branding, text, labels
- Preserve ALL physical characteristics exactly as shown
- Do not add, remove, or modify any product feature
- Match the exact surface finish (matte, glossy, brushed, etc.)

REALISM RULES (MANDATORY):
- This must look like a REAL photograph, NOT a 3D render or CGI
- Realistic reflections based on actual material (metal, plastic, glass, fabric, leather)
- Accurate shadows with natural light falloff
- Subtle micro imperfections for photorealism (minor surface variations, realistic edge quality)
- AVOID: plastic/CGI look, over-smoothing, fake edges, unrealistic specular highlights, artificial sheen

Generate the image following the style direction in the prompt below.
Ensure the product looks IDENTICAL to the reference and NOT reinterpreted.`,
      });
      for (const photoUrl of photos) {
        contentParts.push({
          type: "image_url",
          image_url: { url: photoUrl },
        });
      }
    }

    let finalPrompt = photos.length > 0
      ? `Now generate a professional photo of the EXACT product shown in the reference images above. Follow this style direction:\n\n${prompt}`
      : prompt;

    if (feedback && typeof feedback === "string" && feedback.trim().length > 0) {
      finalPrompt += `\n\nIMPORTANT CORRECTION FROM PREVIOUS ATTEMPT:\nThe previous image had these problems that MUST be fixed: ${sanitizeForLLM(feedback.trim(), 500)}\nMake sure to address these issues while maintaining full product fidelity.`;
    }

    contentParts.push({
      type: "text",
      text: finalPrompt,
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: contentParts,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      return handleAIError(response.status, t, cors);
    }

    const data = await response.json();
    const base64Url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!base64Url) {
      throw new Error("No image was generated");
    }

    // Save to Storage
    let publicUrl = base64Url;
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Decode base64 data URI to bytes
      const base64Data = base64Url.split(",")[1];
      if (base64Data) {
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let j = 0; j < binaryStr.length; j++) bytes[j] = binaryStr.charCodeAt(j);

        const mimeMatch = base64Url.match(/data:(.*?);/);
        const mime = mimeMatch?.[1] || "image/png";
        const ext = mime.includes("png") ? "png" : "jpg";
        const path = `${(auth as { userId: string }).userId}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadErr } = await supabaseAdmin.storage
          .from("generated-images")
          .upload(path, bytes, { contentType: mime, upsert: false });

        if (!uploadErr) {
          const { data: urlData } = supabaseAdmin.storage
            .from("generated-images")
            .getPublicUrl(path);
          publicUrl = urlData.publicUrl;
        } else {
          console.error("Storage upload error:", uploadErr);
        }
      }
    } catch (storageErr) {
      console.error("Storage save error:", storageErr);
      // Fall back to base64 URL
    }

    return new Response(JSON.stringify({ imageUrl: publicUrl }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    return errorResponse(e instanceof Error ? e.message : "Unknown error", 500, cors);
  }
});
