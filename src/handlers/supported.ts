import { Hono } from "hono";

import type { Env } from "../env";
import { internalServerError } from "../errors";

const supportedHandler = new Hono<Env>();

supportedHandler.get("/", async (c) => {
  try {
    return c.json(c.var.X402_FACILITATOR.getSupported());
  } catch (err) {
    console.error({
      error: err instanceof Error ? err.name : "UnknownError",
    });

    return c.json(internalServerError, 500);
  }
});

export { supportedHandler };
