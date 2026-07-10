import type { x402Facilitator } from "@x402/core/facilitator";
import type { Erc20ApprovalGasSponsoringSigner } from "@x402/extensions";
import {
  createErc20ApprovalGasSponsoringExtension,
  EIP2612_GAS_SPONSORING,
} from "@x402/extensions";

import type { EvmNetwork } from "../network/evm";

export type GetErc20ApprovalGasSponsoringSigner = (
  network: EvmNetwork
) => Erc20ApprovalGasSponsoringSigner | null;

export const registerErc20ApprovalGasSponsoringExtension = (
  getErc20ApprovalGasSponsoringSigner: GetErc20ApprovalGasSponsoringSigner,
  facilitator: x402Facilitator
) => {
  const defaultSigner =
    getErc20ApprovalGasSponsoringSigner("eip155:14") ??
    getErc20ApprovalGasSponsoringSigner("eip155:114") ??
    getErc20ApprovalGasSponsoringSigner("eip155:19") ??
    getErc20ApprovalGasSponsoringSigner("eip155:16") ??
    null;
  if (!defaultSigner) return;

  const extension = createErc20ApprovalGasSponsoringExtension(
    defaultSigner,
    (network) => getErc20ApprovalGasSponsoringSigner(network as EvmNetwork) ?? undefined
  );

  facilitator.registerExtension(extension);
};

export const registerErc2612GasSponsoringExtension = (facilitator: x402Facilitator) => {
  facilitator.registerExtension(EIP2612_GAS_SPONSORING);
};
