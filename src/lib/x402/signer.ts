import type { Erc20ApprovalGasSponsoringSigner, TransactionRequest } from "@x402/extensions";
import type { VerifyTypedDataParameters } from "viem";
import { toFacilitatorEvmSigner } from "@x402/evm";

import type { EvmWalletClient } from "../network/evm";

/**
 * Creates a FacilitatorEvmSigner from a viem wallet client.
 * This is the standard signer used for verify/settle operations.
 */
export const createEvmFacilitatorSigner = (client: EvmWalletClient) =>
  toFacilitatorEvmSigner({
    getCode: (args: { address: `0x${string}` }) => client.getCode(args),
    address: client.account.address,
    readContract: (args: {
      address: `0x${string}`;
      abi: readonly unknown[];
      functionName: string;
      args?: readonly unknown[];
    }) =>
      client.readContract({
        ...args,
        args: args.args || [],
      }),
    verifyTypedData: (args: {
      address: `0x${string}`;
      domain: Record<string, unknown>;
      types: Record<string, unknown>;
      primaryType: string;
      message: Record<string, unknown>;
      signature: `0x${string}`;
    }) => client.verifyTypedData(args as VerifyTypedDataParameters),
    writeContract: (args: {
      address: `0x${string}`;
      abi: readonly unknown[];
      functionName: string;
      args: readonly unknown[];
    }) =>
      client.writeContract({
        ...args,
        args: args.args || [],
      }),
    sendTransaction: (args: { to: `0x${string}`; data: `0x${string}` }) =>
      client.sendTransaction(args),
    waitForTransactionReceipt: (args: { hash: `0x${string}` }) =>
      client.waitForTransactionReceipt(args),
  });

export const createErc20ApprovalGasSponsoringSigner = (
  client: EvmWalletClient
): Erc20ApprovalGasSponsoringSigner => {
  const signer = createEvmFacilitatorSigner(client);

  return {
    ...signer,
    sendTransactions: async (transactions: TransactionRequest[]) => {
      const hashes: `0x${string}`[] = [];

      for (const tx of transactions) {
        let hash: `0x${string}`;

        if (typeof tx === "string") {
          hash = await client.sendRawTransaction({
            serializedTransaction: tx,
          });
        } else {
          hash = await client.sendTransaction(tx);
        }
        const receipt = await client.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") {
          throw new Error(`transaction_failed: ${hash}`);
        }

        hashes.push(hash);
      }
      return hashes;
    },
  };
};
