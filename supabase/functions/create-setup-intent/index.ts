/**
 * create-setup-intent
 *
 * Creates a Stripe SetupIntent for the user to add a new payment method.
 * Looks up or creates a Stripe Customer for the user.
 * Authenticated via user's Supabase JWT (manual verification, verify_jwt = false).
 *
 * POST /functions/v1/create-setup-intent
 * Body: {} (empty)
 *
 * Returns: {
 *   client_secret: string,
 *   customerId: string
 * }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Stripe } from "https://esm.sh/stripe@13.11.0";
import { createEdgeLogger, serializeError } from "../_shared/logging.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  const log = createEdgeLogger("create-setup-intent", req, corsHeaders);

  if (req.method === "OPTIONS") {
    return log.complete(new Response("ok", { headers: { ...corsHeaders, "x-request-id": log.requestId } }));
  }

  log.info("request_start");

  if (req.method !== "POST") {
    log.warn("method_not_allowed");
    return log.complete(log.jsonError("Method not allowed", 405));
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      log.warn("missing_or_invalid_auth_header");
      return log.complete(log.jsonError("Missing or invalid auth header", 401));
    }

    const jwt = authHeader.slice(7);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify JWT and get user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user?.id) {
      log.warn("auth_user_failed", { user_error: userError?.message ?? null });
      return log.complete(log.jsonError("Unauthorized", 401));
    }

    // Admin client for DB and Stripe
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      log.error("missing_stripe_secret");
      return log.complete(log.jsonError("Stripe not configured", 500));
    }
    const stripe = new Stripe(stripeSecretKey);

    // Look up or create Stripe Customer
    let stripeCustomerId: string;
    const { data: existing } = await adminClient
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      stripeCustomerId = existing.stripe_customer_id;
      log.info("reusing_existing_stripe_customer", {
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
      });
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      stripeCustomerId = customer.id;
      log.info("created_new_stripe_customer", {
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
      });

      // Store in DB
      const { error: insertError } = await adminClient.from("stripe_customers").insert({
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
      });

      if (insertError) {
        log.error("stripe_customer_insert_error", {
          user_id: user.id,
          db_error: insertError.message,
          stripe_customer_id: stripeCustomerId,
        });
        return log.complete(log.jsonError("Failed to create payment setup", 500));
      }
    }

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
    });

    log.info("setup_intent_created", {
      user_id: user.id,
      stripe_customer_id: stripeCustomerId,
    });
    return log.complete(log.jsonOk({
      client_secret: setupIntent.client_secret,
      customerId: stripeCustomerId,
    }));
  } catch (error) {
    log.error("request_failed", { ...serializeError(error) });
    return log.complete(log.jsonError("Internal server error", 500));
  }
});
