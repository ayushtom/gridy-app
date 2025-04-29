import { create } from "zustand";
import { addAndRemoveCommon } from "../utils/array";
import { PRICE_DIVISOR } from "../utils/constants";

interface GameStore {
  removedTiles: number[];
  setRemovedTiles: (address: number[]) => void;
  totalGemstones: number;
  setTotalGemstones: (total: number) => void;
  totalFoundGemstones: number;
  setTotalFoundGemstones: (total: number) => void;
  prizePool: number;
  setPrizePool: (total: number) => void;
  prizePoolRaw: number;
  setPrizePoolRaw: (total: number) => void;
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
}

const useGameStore = create<GameStore>()((set) => ({
  removedTiles: [],
  setRemovedTiles: (address: number[]) =>
    set((state) => {
      const finalArr = addAndRemoveCommon(state.removedTiles, address);
      return { removedTiles: [...finalArr] };
    }),
  totalGemstones: 0,
  setTotalGemstones: (total: number) => set({ totalGemstones: total }),
  totalFoundGemstones: 0,
  setTotalFoundGemstones: (total: number) =>
    set({ totalFoundGemstones: total }),
  prizePool: 0,
  setPrizePool: (total: number) => set({ prizePool: total / PRICE_DIVISOR }),
  audioEnabled: true,
  setAudioEnabled: (enabled: boolean) => set({ audioEnabled: enabled }),
  prizePoolRaw: 0,
  setPrizePoolRaw: (total: number) => set({ prizePoolRaw: total }),
}));

export default useGameStore;
