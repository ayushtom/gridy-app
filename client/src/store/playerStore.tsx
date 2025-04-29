import { create } from "zustand";

interface PlayerStore {
  selectedTile: number[];
  setSelectedTile: (block: number) => void;
  remainingClicks: number;
  setRemainingClicks: (clicks: number) => void;
  formattedSelectedTile: number[];
  setFormattedSelectedTile: (block: number) => void;
  numberOfPoints: number;
  setNumberOfPoints: (num: number) => void;
}

const usePlayerStore = create<PlayerStore>()((set) => ({
  selectedTile: [],
  setSelectedTile: (block: number) =>
    set((state) => {
      if (block === -1) return { selectedTile: [] };
      if (state.selectedTile.includes(block)) {
        return {
          selectedTile: state.selectedTile.filter((tile) => tile !== block),
        };
      }
      return { selectedTile: [...state.selectedTile, block] };
    }),
  remainingClicks: 0,
  setRemainingClicks: (clicks: number) => set({ remainingClicks: clicks }),
  formattedSelectedTile: [],
  setFormattedSelectedTile: (block: number) =>
    set((state) => {
      if (block === -1) return { formattedSelectedTile: [] };
      if (state.formattedSelectedTile.includes(block)) {
        return {
          formattedSelectedTile: state.formattedSelectedTile.filter(
            (tile) => tile !== block
          ),
        };
      }
      return { formattedSelectedTile: [...state.formattedSelectedTile, block] };
    }),
  numberOfPoints: 0,
  setNumberOfPoints: (num: number) => set({ numberOfPoints: num }),
}));

export default usePlayerStore;
