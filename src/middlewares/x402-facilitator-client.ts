import { x402Facilitator } from "@x402/core/facilitator";
import { createMiddleware } from "hono/factory";
import { isHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import type { Env } from "../env";
import type { EvmNetwork } from "../lib/network/evm";
import { internalServerError } from "../errors";
import { createEvmWalletClient, EVM_NETWORKS } from "../lib/network/evm";
import {
  registerErc20ApprovalGasSponsoringExtension,
  registerErc2612GasSponsoringExtension,
} from "../lib/x402/extensions";
import {
  registerEvmBatchSettlementScheme,
  registerEvmExactScheme,
  registerEvmUptoScheme,
} from "../lib/x402/scheme";
import {
  createErc20ApprovalGasSponsoringSigner,
  createEvmFacilitatorSigner,
} from "../lib/x402/signer";

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

    const account = privateKeyToAccount(privateKey);

    const walletClients = new Map(
      EVM_NETWORKS.map((network) => {
        const rpcUrlKey = RPC_URL_BY_NETWORK[network];
        const rpcUrl = c.env[rpcUrlKey];

        const walletClient = createEvmWalletClient(network, account, rpcUrl || undefined);

        return [network, walletClient];
      })
    );

    // Register scheme
    EVM_NETWORKS.forEach((network) => {
      const walletClient = walletClients.get(network);
      if (!walletClient) return;

      const facilitatorSigner = createEvmFacilitatorSigner(walletClient);

      registerEvmExactScheme(network, facilitatorSigner, facilitatorClient);
      registerEvmUptoScheme(network, facilitatorSigner, facilitatorClient);
      registerEvmBatchSettlementScheme(network, facilitatorSigner, facilitatorClient);
    });

    // Register extension
    registerErc2612GasSponsoringExtension(facilitatorClient);
    registerErc20ApprovalGasSponsoringExtension((network) => {
      const walletClient = walletClients.get(network);
      if (!walletClient) return null;

      const facilitatorSigner = createEvmFacilitatorSigner(walletClient);
      const erc20ApprovalGasSponsoringSigner = createErc20ApprovalGasSponsoringSigner(
        facilitatorSigner,
        walletClient
      );

      return erc20ApprovalGasSponsoringSigner;
    }, facilitatorClient);

    c.set("X402_FACILITATOR", facilitatorClient);

    return next();
  });
