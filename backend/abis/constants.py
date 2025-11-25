UI_POOL_DATA_PROVIDER = "0x3F78BBD206e4D3c504Eb854232EdA7e47E9Fd8FC"

POOL_DATA_PROVIDER = "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"

POOL_ADDRESS = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2"

LIQUIDATION_CALL_EVENT_ABI = {
    "anonymous": False,
    "inputs": [
        {"indexed": True, "internalType": "address", "name": "collateralAsset", "type": "address"},
        {"indexed": True, "internalType": "address", "name": "debtAsset", "type": "address"},
        {"indexed": True, "internalType": "address", "name": "user", "type": "address"},
        {"indexed": False, "internalType": "uint256", "name": "debtToCover", "type": "uint256"},
        {"indexed": False, "internalType": "uint256", "name": "liquidatedCollateralAmount", "type": "uint256"},
        {"indexed": False, "internalType": "address", "name": "liquidator", "type": "address"},
        {"indexed": False, "internalType": "bool", "name": "receiveAToken", "type": "bool"},
    ],
    "name": "LiquidationCall",
    "type": "event",
}

GET_USER_ACCOUNT_DATA_ABI = {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserAccountData",
    "outputs": [
        {"internalType": "uint256", "name": "totalCollateralBase", "type": "uint256"},
        {"internalType": "uint256", "name": "totalDebtBase", "type": "uint256"},
        {"internalType": "uint256", "name": "availableBorrowsBase", "type": "uint256"},
        {"internalType": "uint256", "name": "currentLiquidationThreshold", "type": "uint256"},
        {"internalType": "uint256", "name": "ltv", "type": "uint256"},
        {"internalType": "uint256", "name": "healthFactor", "type": "uint256"},
    ],
    "stateMutability": "view",
    "type": "function",
}

GET_PRICE_ORACLE_ABI = {
    "inputs": [],
    "name": "getPriceOracle",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function",
}

GET_RESERVES_DATA_ABI = {
  "inputs": [
    {
      "internalType": "contract IPoolAddressesProvider",
      "name": "provider",
      "type": "address"
    }
  ],
  "name": "getReservesData",
  "outputs": [
    {
      "components": [
        {
          "internalType": "address",
          "name": "underlyingAsset",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "symbol",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "decimals",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "baseLTVasCollateral",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "reserveLiquidationThreshold",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "reserveLiquidationBonus",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "reserveFactor",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "usageAsCollateralEnabled",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "borrowingEnabled",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "isActive",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "isFrozen",
          "type": "bool"
        },
        {
          "internalType": "uint128",
          "name": "liquidityIndex",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "variableBorrowIndex",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "liquidityRate",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "variableBorrowRate",
          "type": "uint128"
        },
        {
          "internalType": "uint40",
          "name": "lastUpdateTimestamp",
          "type": "uint40"
        },
        {
          "internalType": "address",
          "name": "aTokenAddress",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "variableDebtTokenAddress",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "interestRateStrategyAddress",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "availableLiquidity",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalScaledVariableDebt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "priceInMarketReferenceCurrency",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "priceOracle",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "variableRateSlope1",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "variableRateSlope2",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "baseVariableBorrowRate",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "optimalUsageRatio",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isPaused",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "isSiloedBorrowing",
          "type": "bool"
        },
        {
          "internalType": "uint128",
          "name": "accruedToTreasury",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "unbacked",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "isolationModeTotalDebt",
          "type": "uint128"
        },
        {
          "internalType": "bool",
          "name": "flashLoanEnabled",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "debtCeiling",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "debtCeilingDecimals",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "borrowCap",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "supplyCap",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "borrowableInIsolation",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "virtualAccActive",
          "type": "bool"
        },
        {
          "internalType": "uint128",
          "name": "virtualUnderlyingBalance",
          "type": "uint128"
        }
      ],
      "internalType": "struct IUiPoolDataProviderV3.AggregatedReserveData[]",
      "name": "",
      "type": "tuple[]"
    },
    {
      "components": [
        {
          "internalType": "uint256",
          "name": "marketReferenceCurrencyUnit",
          "type": "uint256"
        },
        {
          "internalType": "int256",
          "name": "marketReferenceCurrencyPriceInUsd",
          "type": "int256"
        },
        {
          "internalType": "int256",
          "name": "networkBaseTokenPriceInUsd",
          "type": "int256"
        },
        {
          "internalType": "uint8",
          "name": "networkBaseTokenPriceDecimals",
          "type": "uint8"
        }
      ],
      "internalType": "struct IUiPoolDataProviderV3.BaseCurrencyInfo",
      "name": "",
      "type": "tuple"
    }
  ],
  "stateMutability": "view",
  "type": "function"
}

GET_ASSET_PRICE_ABI = {
    "inputs": [{"internalType": "address", "name": "asset", "type": "address"}],
    "name": "getAssetPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function",
}
