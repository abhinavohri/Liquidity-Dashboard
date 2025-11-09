import { createConfig } from "ponder";
import {http} from 'viem';
import { AaveV3PoolAbi } from "./abis/PoolAbi";



export default createConfig({
  database: {
    kind: 'postgres',
    connectionString: process.env.DATABASE_URL,
  },
  chains: { mainnet: { id: 1, rpc: http(process.env.PONDER_RPC_URL_1) } },
  contracts: {
    AaveV3Pool: {
      abi: AaveV3PoolAbi,
      address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
      chain: "mainnet",
      startBlock: 23700000,
    },
  }
});
