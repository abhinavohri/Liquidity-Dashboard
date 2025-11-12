// We are now using the full JSON ABI format for just this one event.
// This perfectly matches the type Ponder expects.
export const AaveV3PoolAbi = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "collateralAsset",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "debtAsset",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "debtToCover",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "liquidatedCollateralAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "liquidator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "receiveAToken",
        "type":"bool"
      }
    ],
    "name": "LiquidationCall",
    "type": "event"
  }
] as const; // We still keep "as const"