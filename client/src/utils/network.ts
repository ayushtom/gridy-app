export enum NetworkType {
  TESTNET = "TESTNET",
  MAINNET = "MAINNET",
}

export const getCurrentNetwork = (): NetworkType => {
  return import.meta.env.VITE_IS_TESTNET === "true"
    ? NetworkType.TESTNET
    : NetworkType.MAINNET;
};
