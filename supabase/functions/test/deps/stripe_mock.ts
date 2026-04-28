const _queues: Record<string, Array<unknown>> = {};
export const stripeCallLog: Array<{ method: string; args: unknown[] }> = [];

export function pushStripeMock(method: string, val: unknown) {
  (_queues[method] ??= []).push(val);
}

function pop(method: string, fallback: unknown): unknown {
  const q = _queues[method];
  return q?.length ? q.shift() : fallback;
}

export function resetStripeMocks() {
  for (const k of Object.keys(_queues)) delete _queues[k];
  stripeCallLog.length = 0;
}

export class Stripe {
  constructor(_key: string) {}

  customers = {
    create: async (args: unknown): Promise<any> => {
      stripeCallLog.push({ method: "customers.create", args: [args] });
      return pop("customers.create", { id: "cus_mock" });
    },
    retrieve: async (id: string, opts?: unknown): Promise<any> => {
      stripeCallLog.push({ method: "customers.retrieve", args: [id, opts] });
      return pop("customers.retrieve", { invoice_settings: { default_payment_method: null } });
    },
    update: async (id: string, args: unknown): Promise<any> => {
      stripeCallLog.push({ method: "customers.update", args: [id, args] });
      return pop("customers.update", {});
    },
  };

  setupIntents = {
    create: async (args: unknown): Promise<any> => {
      stripeCallLog.push({ method: "setupIntents.create", args: [args] });
      return pop("setupIntents.create", { client_secret: "seti_mock_secret" });
    },
    retrieve: async (id: string): Promise<any> => {
      stripeCallLog.push({ method: "setupIntents.retrieve", args: [id] });
      return pop("setupIntents.retrieve", { status: "succeeded", customer: "cus_mock" });
    },
  };

  paymentMethods = {
    attach: async (id: string, args: unknown): Promise<any> => {
      stripeCallLog.push({ method: "paymentMethods.attach", args: [id, args] });
      return pop("paymentMethods.attach", {});
    },
  };

  charges = {
    list: async (args: unknown): Promise<any> => {
      stripeCallLog.push({ method: "charges.list", args: [args] });
      return pop("charges.list", { data: [] });
    },
  };
}
