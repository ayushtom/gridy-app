const BASE_URL = import.meta.env.VITE_API;
const COIN_QUOTE_API = import.meta.env.VITE_COIN_QUOTE_API;
const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS;
let tokenPrice: number | null = null;

export type Block = {
  _id: string;
  block_id: number;
  game_id: number;
  _cursor: { to: null; from: number };
  player: string;
};

const checkForGemstone = async (block_id: number) => {
  try {
    const response = await fetch(
      `${BASE_URL}/check_for_gemstone?block_id=${block_id}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const fetchMinedBlocks = async (): Promise<{ blocks: Block[] }> => {
  return (await fetch(`${BASE_URL}/get_blocks_mined?game_id=${1}`)).json();
};

const getGemstoneClaimParams = async (block_id: number) => {
  try {
    const response = await fetch(
      `${BASE_URL}/get_claim_gemstone_params?block_id=${block_id}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getCoinQuote = async () => {
  if (tokenPrice) {
    return tokenPrice;
  }
  const response = await fetch(`${COIN_QUOTE_API}/${TOKEN_ADDRESS}`);

  const data = await response
    .json()
    .then((res) => {
      return res.market.currentPrice;
    })
    .catch((error) => {
      console.error(error);
      return null;
    });

  tokenPrice = data;
  return data;
};

const getPendingClaims = async (address: string) => {
  try {
    const response = await fetch(
      `${BASE_URL}/get_pending_claims?address=${address}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const ApiService = {
  checkForGemstone,
  fetchMinedBlocks,
  getGemstoneClaimParams,
  getPendingClaims,
  getCoinQuote,
};
