import { useState } from 'react';
import makeBlockie from 'ethereum-blockies-base64';
import { getAddress } from 'viem';
import { TRUST_WALLET_ASSETS_URL } from '../../../constants';

interface TokenIconProps {
  tokenAddress: string;
  size?: number;
}

const tokenIconUrl = (addr: string) =>
  `${TRUST_WALLET_ASSETS_URL}${getAddress(addr)}/logo.png`;

function TokenIcon({ tokenAddress, size = 24 }: TokenIconProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <img
        src={makeBlockie(tokenAddress)}
        alt=""
        width={size}
        height={size}
        style={{ borderRadius: '50%' }}
      />
    );
  }

  return (
    <img
      src={tokenIconUrl(tokenAddress)}
      alt=""
      width={size}
      height={size}
      style={{ borderRadius: '50%' }}
      onError={() => setHasError(true)}
    />
  );
}

export default TokenIcon;
