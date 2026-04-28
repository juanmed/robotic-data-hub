/**
 * get-payment-info
 *
 * Fetches the user's default payment method and recent charges from Stripe.
 * Authenticated via user's Supabase JWT (manual verification, verify_jwt = false).
 *
 * GET /functions/v1/get-payment-info
 *
 * Returns: {
 *   hasPaymentMethod: boolean,
 *   card?: { last4, brand, exp_month, exp_year },
 *   billing?: { name, country, postal_code },
 *   charges?: { id, amount, currency, status, description, created }[]
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
  const log = createEdgeLogger("get-payment-info", req, corsHeaders);

  if (req.method === "OPTIONS") {
    return log.complete(new Response("ok", { headers: { ...corsHeaders, "x-request-id": log.requestId } }));
  }

  log.info("request_start");

  if (req.method !== "GET") {
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

    // Look up stripe_customers
    const { data: stripeCustomer, error: customerError } = await adminClient
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (customerError) {
      log.error("stripe_customer_lookup_error", {
        user_id: user.id,
        db_error: customerError.message,
      });
      return log.complete(log.jsonError("Database error", 500));
    }

    if (!stripeCustomer) {
      log.info("no_stripe_customer", { user_id: user.id });
      return log.complete(log.jsonOk({ hasPaymentMethod: false }));
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      log.error("missing_stripe_secret", { user_id: user.id });
      return log.complete(log.jsonError("Stripe not configured", 500));
    }
    const stripe = new Stripe(stripeSecretKey);

    // Get customer with default payment method
    const customer = await stripe.customers.retrieve(stripeCustomer.stripe_customer_id, {
      expand: ["invoice_settings.default_payment_method"],
    });

    if (!("invoice_settings" in customer) || !customer.invoice_settings?.default_payment_method) {
      log.info("no_default_payment_method", {
        user_id: user.id,
        stripe_customer_id: stripeCustomer.stripe_customer_id,
      });
      return log.complete(log.jsonOk({ hasPaymentMethod: false }));
    }

    const paymentMethod = customer.invoice_settings.default_payment_method;
    if (typeof paymentMethod === "string" || !("card" in paymentMethod)) {
      log.info("non_card_default_payment_method", {
        user_id: user.id,
        stripe_customer_id: stripeCustomer.stripe_customer_id,
      });
      return log.complete(log.jsonOk({ hasPaymentMethod: false }));
    }

    // Get recent charges
    const charges = await stripe.charges.list({
      customer: stripeCustomer.stripe_customer_id,
      limit: 5,
    });

    // Insert audit log
    const { error: auditError } = await adminClient.from("payment_audit_log").insert({
      user_id: user.id,
      event_type: "view_payment_info",
    });
    if (auditError) {
      log.warn("payment_audit_insert_failed", {
        user_id: user.id,
        db_error: auditError.message,
      });
    }

    // Return sanitized data
    const response = {
      hasPaymentMethod: true,
      card: {
        last4: paymentMethod.card.last4,
        brand: paymentMethod.card.brand,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year,
      },
      billing: {
        name: paymentMethod.billing_details?.name || "",
        country: paymentMethod.billing_details?.address?.country || "",
        postal_code: paymentMethod.billing_details?.address?.postal_code || "",
      },
      charges: charges.data.map((charge: any) => ({
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        description: charge.description || "",
        created: charge.created,
      })),
    };

    log.info("payment_info_fetched", {
      user_id: user.id,
      stripe_customer_id: stripeCustomer.stripe_customer_id,
      charge_count: response.charges.length,
    });
    return log.complete(log.jsonOk(response));
  } catch (error) {
    log.error("request_failed", { ...serializeError(error) });
    return log.complete(log.jsonError("Internal server error", 500));
  }
});
