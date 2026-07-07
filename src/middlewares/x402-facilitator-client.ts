import { x402Facilitator } from "@x402/core/facilitator";
import { createMiddleware } from "hono/factory";
import { isHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import type { Env } from "../env";
import type { EvmNetwork } from "../lib/network/evm";
import { internalServerError } from "../errors";
import { createEvmWalletClient, EVM_NETWORKS } from "../lib/network/evm";
import { registerEvmExactScheme, registerEvmUptoScheme } from "../lib/x402/scheme";
import { createEvmFacilitatorSigner } from "../lib/x402/signer";

export type X402FacilitatorClientVariables = {
  X402_FACILITATOR: x402Facilitator;
};

const RPC_URL_BY_NETWORK = {
  "eip155:14": "FLARE_MAINNET_RPC_URL",
  "eip155:114": "FLARE_TESTNET_RPC_URL",
  "eip155:19": "SONGBIRD_MAINNET_RPC_URL",
  "eip155:16": "SONGBIRD_TESTNET_RPC_URL",
} as const satisfies Record<EvmNetwork, `${string}_RPC_URL`>;

export const x402FacilitatorClient = () =>
  createMiddleware<Env>(async (c, next) => {
    const facilitatorClient = new x402Facilitator();

    const privateKey = c.env.FACILITATOR_PRIVATE_KEY;
    if (!isHex(privateKey)) {
      console.error({
        error: "Invalid facilitator private key",
      });

      return c.json(internalServerError, 500);
    }

    const signer = privateKeyToAccount(privateKey);

    for (const network of EVM_NETWORKS) {
      const rpcUrlKey = RPC_URL_BY_NETWORK[network];
      const rpcUrl = c.env[rpcUrlKey];

      const evmWalletClient = createEvmWalletClient(network, signer, rpcUrl || undefined);
      const evmFacilitatorSigner = createEvmFacilitatorSigner(evmWalletClient);

      registerEvmExactScheme(network, evmFacilitatorSigner, facilitatorClient);
      registerEvmUptoScheme(network, evmFacilitatorSigner, facilitatorClient);
    }

    c.set("X402_FACILITATOR", facilitatorClient);

    return next();
  });
