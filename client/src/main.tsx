"use client";

import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { StarknetProvider } from "./store/starknetProvider.tsx";

async function init() {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("React root not found");
  const root = ReactDOM.createRoot(rootElement as HTMLElement);

  root.render(
    // <React.StrictMode>
    <StarknetProvider>
      <div className="flex h-screen p-4 sm:hidden">
        <p className=" text-black text-lg flex justify-center w-full h-full mt-4">
          gridy.fun is not supported on mobile yet. This game involves some
          heavy resources to load which might not work perfectly with all
          devices <br />
          <br />
          Please use a desktop browser.
        </p>
      </div>
      <div className="hidden sm:block">
        <App />
      </div>
    </StarknetProvider>
    // </React.StrictMode>
  );
}

init();
