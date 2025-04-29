"use client";
import React from "react";
import { sepolia, mainnet } from "@starknet-react/chains";
import {
  StarknetConfig,
  argent,
  braavos,
  jsonRpcProvider,
  useInjectedConnectors,
  voyager,
} from "@starknet-react/core";
import { constants } from "starknet";
import { Connector, InjectedConnector } from "@starknet-react/core";
import { WebWalletConnector } from "starknetkit/webwallet";
import { ArgentMobileConnector } from "starknetkit/argentMobile";

export const availableConnectors: Connector[] = [
  new InjectedConnector({ options: { id: "braavos", name: "Braavos" } }),
  new InjectedConnector({ options: { id: "argentX", name: "Argent X" } }),
  new WebWalletConnector({ url: "https://web.argent.xyz" }),
  new ArgentMobileConnector({
    dappName: "Gridy.fun",
    url: import.meta.env.VITE_PUBLIC_APP_LINK as string,
    chainId: constants.NetworkName.SN_MAIN,
    icons: ["https://gridy.fun/favicon.ico"],
  }),
];

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  const providers = jsonRpcProvider({
    rpc: () => ({
      nodeUrl: import.meta.env.VITE_PUBLIC_RPC_URL as string,
    }),
  });

  const { connectors } = useInjectedConnectors({
    // Show these connectors if the user has no connector installed.
    recommended: [argent(), braavos()],
    // Hide recommended connectors if the user has any connector installed.
    includeRecommended: "onlyIfNoConnectors",
    // Randomize the order of the connectors.
    order: "random",
  });

  return (
    <StarknetConfig
      chains={[import.meta.env.VITE_IS_TESTNET ? sepolia : mainnet]}
      provider={providers}
      connectors={connectors}
      explorer={voyager}
    >
      {children}
    </StarknetConfig>
  );
}
