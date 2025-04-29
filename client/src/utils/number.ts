import { ApiService } from "../services/apiService";
import { PRICE_DIVISOR } from "./constants";

// Format the price to USD using the locale, style, and currency.
export const currencyFormatter = (price: number) => {
  const USDollar = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return USDollar.format(price);
};

export const computeWinProbability = (
  totalGemstones: number,
  totalTiles: number,
  desiredTiles: number
): number => {
  // Total number of tiles
  const N = totalTiles;

  // Number of gemstones
  const G = totalGemstones;

  // Number of mined tiles
  const m = desiredTiles;

  // Probability of not finding a gemstone in a single tile
  const P_no_gemstone_single = (N - G) / N;

  // Probability of not finding a gemstone in 20 mined tiles
  const P_no_gemstone_20 = Math.pow(P_no_gemstone_single, m);

  // Probability of finding at least one gemstone
  const P_at_least_one_gemstone = 1 - P_no_gemstone_20;

  return Number(P_at_least_one_gemstone.toFixed(2));
};

export const formatSellingPrice = async (price: bigint): Promise<string> => {
  const res = await ApiService.getCoinQuote();
  const number = Number(price) / PRICE_DIVISOR;
  const formattedPrice = res * number;
  return formattedPrice.toFixed(2);
};
