import { useContract } from "@starknet-react/core";
import { Abi } from "starknet";
import game_abi from "../abi/grid_game_GridGame.contract_class.json";

export function useGameContract() {
  return useContract({
    abi: game_abi as Abi,
    address: import.meta.env.VITE_GAME_CONTRACT_ADDRESS,
  });
}
