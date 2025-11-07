import { createConfig } from "ponder";

import { UnverifiedContractAbi } from "./abis/UnverifiedContractAbi";

export default createConfig({
  chains: { mainnet: { id: 1, rpc: "http(process.env.PONDER_RPC_URL_1)" } },
  contracts: {
    UnverifiedContract: {
      abi: UnverifiedContractAbi,
      address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
      chain: "mainnet",
    },
  },
});
