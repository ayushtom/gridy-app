"use client";

import "./App.css";
import Playground from "./playground";
import { cn } from "./utils/style";
import { Boxes } from "./components/backgroundGrid/Boxes";
import { TopOverlay } from "./components/overlay";
import { useEffect, useState } from "react";
import GetStartedButton from "./components/ui/button/getStarted";
import { Toaster } from "sonner";
import useWalletConnectStore from "./store/walletConnect";
import { WalletConnect } from "./components/walletConnect";
import Demo from "./demo";

function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true);
  const { showWalletModal } = useWalletConnectStore();

  useEffect(() => {
    // check if first time user
    const isFirstTimeUser = localStorage.getItem("firstTimeUser");
    if (isFirstTimeUser) {
      if (isFirstTimeUser === "false") {
        setIsFirstTimeUser(false);
      } else {
        localStorage.setItem("firstTimeUser", "true");
      }
    }
  }, []);

  return (
    <main className="h-screen w-screen">
      {isStarted ? (
        !isFirstTimeUser ? (
          <>
            <Playground />
            <TopOverlay />
            <Toaster richColors />
            {showWalletModal ? <WalletConnect /> : null}
          </>
        ) : (
          <>
            <Demo setIsFirstTimeUser={setIsFirstTimeUser} />
            <Toaster richColors />
          </>
        )
      ) : (
        <div className="h-screen relative w-full overflow-hidden bg-green-900 flex flex-col items-center justify-center">
          <div className="absolute inset-0 w-full h-full bg-slate-900 z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
          <Boxes />
          <h1
            className={cn("md:text-9xl text-6xl text-white relative z-20")}
            style={{
              fontFamily: "LcdPhone",
            }}
          >
            Gridy
          </h1>
          <GetStartedButton onClick={() => setIsStarted(true)} />
        </div>
      )}
    </main>
  );
}

export default App;
