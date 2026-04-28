/**
 * update-payment-method
 *
 * Attaches a payment method to the user's Stripe Customer after SetupIntent confirmation.
 * Validates the SetupIntent server-side before updating the default payment method.
 * Authenticated via user's Supabase JWT (manual verification, verify_jwt = false).
 *
 * POST /functions/v1/update-payment-method
 * Body: {
 *   setup_intent_id: string,
 *   payment_method_id: string
 * }
 *
 * Returns: { success: true }
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
  const log = createEdgeLogger("update-payment-method", req, corsHeaders);

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

    // Parse body
    let body: { setup_intent_id: string; payment_method_id: string };
    try {
      body = await req.json();
    } catch {
      log.warn("malformed_json_body", { user_id: user.id });
      return log.complete(log.jsonError("Malformed JSON body", 400));
    }

    if (!body.setup_intent_id || !body.payment_method_id) {
      log.warn("missing_required_fields", { user_id: user.id });
      return log.complete(log.jsonError("Missing setup_intent_id or payment_method_id", 400));
    }

    // Admin client for DB and Stripe
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Look up stripe_customers (verify user owns this)
    const { data: stripeCustomer, error: customerError } = await adminClient
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (customerError || !stripeCustomer) {
      log.warn("stripe_customer_not_found", {
        user_id: user.id,
        db_error: customerError?.message ?? null,
      });
      return log.complete(log.jsonError("Payment setup not found", 404));
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      log.error("missing_stripe_secret", { user_id: user.id });
      return log.complete(log.jsonError("Stripe not configured", 500));
    }
    const stripe = new Stripe(stripeSecretKey);

    // Retrieve and validate SetupIntent server-side
    const setupIntent = await stripe.setupIntents.retrieve(body.setup_intent_id);

    // Validate SetupIntent belongs to this customer and succeeded
    if (setupIntent.status !== "succeeded") {
      log.warn("setup_intent_not_confirmed", {
        user_id: user.id,
        setup_intent_id: body.setup_intent_id,
        setup_intent_status: setupIntent.status,
      });
      return log.complete(log.jsonError("SetupIntent not confirmed", 400));
    }

    if (setupIntent.customer !== stripeCustomer.stripe_customer_id) {
      log.warn("setup_intent_customer_mismatch", {
        user_id: user.id,
        setup_intent_id: body.setup_intent_id,
        expected_customer: stripeCustomer.stripe_customer_id,
        actual_customer: setupIntent.customer,
      });
      return log.complete(log.jsonError("SetupIntent does not belong to this customer", 403));
    }

    // Attach payment method (idempotent operation)
    await stripe.paymentMethods.attach(body.payment_method_id, {
      customer: stripeCustomer.stripe_customer_id,
    });

    // Set as default payment method
    await stripe.customers.update(stripeCustomer.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: body.payment_method_id,
      },
    });

    // Insert audit log
    const { error: auditError } = await adminClient.from("payment_audit_log").insert({
      user_id: user.id,
      event_type: "update_payment_method",
    });
    if (auditError) {
      log.warn("payment_audit_insert_failed", {
        user_id: user.id,
        db_error: auditError.message,
      });
    }

    log.info("payment_method_updated", {
      user_id: user.id,
      setup_intent_id: body.setup_intent_id,
      payment_method_id: body.payment_method_id,
      stripe_customer_id: stripeCustomer.stripe_customer_id,
    });
    return log.complete(log.jsonOk({ success: true }));
  } catch (error) {
    log.error("request_failed", { ...serializeError(error) });
    return log.complete(log.jsonError("Internal server error", 500));
  }
});
