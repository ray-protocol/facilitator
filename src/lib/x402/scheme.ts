import type { x402Facilitator } from "@x402/core/facilitator";
import type { FacilitatorEvmSigner } from "@x402/evm";
import { ExactEvmScheme } from "@x402/evm/exact/facilitator";
import { UptoEvmScheme } from "@x402/evm/upto/facilitator";

import type { EvmNetwork } from "../network/evm";

export const registerEvmExactScheme = (
  network: EvmNetwork,
  signer: FacilitatorEvmSigner,
  facilitator: x402Facilitator
) => {
  facilitator.register(network, new ExactEvmScheme(signer));
};

export const registerEvmUptoScheme = (
  network: EvmNetwork,
  signer: FacilitatorEvmSigner,
  facilitator: x402Facilitator
) => {
  facilitator.register(network, new UptoEvmScheme(signer));
};
