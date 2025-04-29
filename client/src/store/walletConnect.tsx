import { create } from "zustand";

interface WalletConnectStore {
  showWalletModal: boolean;
  setShowWalletModal: (show: boolean) => void;
}

const useWalletConnectStore = create<WalletConnectStore>()((set) => ({
  showWalletModal: false,
  setShowWalletModal: (show: boolean) => set({ showWalletModal: show }),
}));

export default useWalletConnectStore;
