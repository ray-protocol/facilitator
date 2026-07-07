import type { PaymentPayload, PaymentRequirements } from "@x402/core/types";
import { parsePaymentPayload, parsePaymentRequirements } from "@x402/core/schemas";
import { Hono } from "hono";
import { validator } from "hono/validator";

import type { Env } from "../env";
import { internalServerError } from "../errors";

const verifyHandler = new Hono<Env>();

verifyHandler.post(
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

      const verifyResponse = await c.var.X402_FACILITATOR.verify(
        paymentPayload as PaymentPayload,
        paymentRequirements as PaymentRequirements
      );

      return c.json(verifyResponse, 200);
    } catch (err) {
      console.error({
        error: err instanceof Error ? err.name : "UnknownError",
      });

      return c.json(internalServerError, 500);
    }
  }
);

export { verifyHandler };
