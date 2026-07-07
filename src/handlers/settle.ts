import type { PaymentPayload, PaymentRequirements } from "@x402/core/types";
import { parsePaymentPayload, parsePaymentRequirements } from "@x402/core/schemas";
import { Hono } from "hono";
import { validator } from "hono/validator";

import type { Env } from "../env";
import { internalServerError } from "../errors";

const settleHandler = new Hono<Env>();

settleHandler.post(
  "/",
  validator("json", (value, c) => {
    const { paymentPayload, paymentRequirements } = value;

    const resolvedPaymentPayload = parsePaymentPayload(paymentPayload);
    if (!resolvedPaymentPayload.success) return c.json(resolvedPaymentPayload.error.issues, 400);

    const resolvedPaymentRequirements = parsePaymentRequirements(paymentRequirements);
    if (!resolvedPaymentRequirements.success)
      return c.json(resolvedPaymentRequirements.error.issues, 400);

    return {
      paymentPayload: resolvedPaymentPayload.data,
      paymentRequirements: resolvedPaymentRequirements.data,
    };
  }),
  async (c) => {
    try {
      const { paymentPayload, paymentRequirements } = c.req.valid("json");

      const settleResponse = await c.var.X402_FACILITATOR.settle(
        paymentPayload as PaymentPayload,
        paymentRequirements as PaymentRequirements
      );

      return c.json(settleResponse, 200);
    } catch (err) {
      console.error({
        error: err instanceof Error ? err.name : "UnknownError",
      });

      return c.json(internalServerError, 500);
    }
  }
);

export { settleHandler };
