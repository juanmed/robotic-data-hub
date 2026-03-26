-- Stripe customer mapping (one per user)
CREATE TABLE public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own stripe customer" ON public.stripe_customers
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Audit log for payment info access (edge-function writes only, users cannot read)
CREATE TABLE public.payment_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view_payment_info', 'update_payment_method')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for queries
CREATE INDEX idx_payment_audit_log_user_created ON public.payment_audit_log(user_id, created_at DESC);

ALTER TABLE public.payment_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role (edge functions) can insert. Users cannot read (no SELECT policy).
-- This prevents users from seeing internal event logs and keeps audit data server-only.
