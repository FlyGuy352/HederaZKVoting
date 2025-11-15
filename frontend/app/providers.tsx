"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HWBridgeProvider, useHWBridge } from "@buidlerlabs/hashgraph-react-wallets";
import { HashpackConnector } from "@buidlerlabs/hashgraph-react-wallets/connectors";
import {
  HederaMainnet,
  HederaTestnet,
} from "@buidlerlabs/hashgraph-react-wallets/chains";

const queryClient = new QueryClient();

const metadata = {
  name: "ZK Voting",
  description: "ZK Voting - Hedera Hashgraph DApp",
  icons: typeof window !== "undefined" ? [`${window.location.origin}/favicon.ico`] : [],
  url: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
};

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <HWBridgeProvider
        metadata={metadata}
        projectId={process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID}
        connectors={[HashpackConnector]}
        chains={[HederaTestnet, HederaMainnet]}
        multiSession={false}
        debug={false}
      >
        <AppContent>
          {children}
        </AppContent>
      </HWBridgeProvider>
    </QueryClientProvider>
  );
}

const AppContent = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const bridge = useHWBridge();

  return bridge?.isInitialized ? children : <div>Loading...</div>;
};