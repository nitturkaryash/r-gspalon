// Follow this setup guide to integrate the Deno runtime: https://deno.com/manual/runtime/manual
import { serve } from "https://deno.land/std@0.183.0/http/server.ts";

console.log("Hello from Functions!");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Apply CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name } = await req.json();
    const data = {
      message: `Hello ${name || "World"}!`,
      timestamp: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Default response if no JSON body or error
    return new Response(
      JSON.stringify({ message: "Hello World!", timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// To invoke: http://localhost:54321/functions/v1/hello-world 