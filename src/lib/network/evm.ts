import type { Account, Chain } from "viem";
import { createWalletClient, http, publicActions } from "viem";
import { flare, flareTestnet, songbird, songbirdTestnet } from "viem/chains";

export const EVM_NETWORKS = ["eip155:14", "eip155:114", "eip155:19", "eip155:16"] as const;
export type EvmNetwork = (typeof EVM_NETWORKS)[number];

export const EVM_CHAINS = {
  "eip155:14": flare,
  "eip155:114": flareTestnet,
  "eip155:19": songbird,
  "eip155:16": songbirdTestnet,
} as const satisfies Record<(typeof EVM_NETWORKS)[number], Chain>;

export const createEvmWalletClient = (network: EvmNetwork, account: Account, rpcUrl?: string) => {
  const chain = EVM_CHAINS[network];

  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  }).extend(publicActions);
};

export type EvmWalletClient = ReturnType<typeof createEvmWalletClient>;
