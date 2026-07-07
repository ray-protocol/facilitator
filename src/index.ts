import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { trimTrailingSlash } from "hono/trailing-slash";

import type { Env } from "./env";
import { internalServerError } from "./errors";
import { settleHandler } from "./handlers/settle";
import { supportedHandler } from "./handlers/supported";
import { verifyHandler } from "./handlers/verify";
import { x402FacilitatorClient } from "./middlewares/x402-facilitator-client";

const app = new Hono<Env>();

app.use(logger()).use(trimTrailingSlash()).use(cors());

app.get("/", (c) =>
  c.json({
    title: "Ray Protocol — Flare Network x402 facilitator",
    availableEndpoints: [
      "/verify - Verify a transaction",
      "/settle - Settle a transaction",
      "/supported - Get supported networks",
    ],
  })
);

app
  .use(x402FacilitatorClient())
  .route("/settle", settleHandler)
  .route("/verify", verifyHandler)
  .route("/supported", supportedHandler);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  console.error(err);
  return c.json(internalServerError, 500);
});

export default app;
