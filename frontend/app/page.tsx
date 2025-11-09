"use client";

import { useEffect, useState } from "react";
import { AccountId } from "@hashgraph/sdk";

export default function Home() {

  const [accountId, setAccountId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const setupHashConnect = async () => {
      const { getHashConnectInstance } = await import("@/lib/hashconnect"); 
      const hc = getHashConnectInstance();
      await hc.init();

      hc.pairingEvent.on(pairingData => {
          console.log("Pairing event:", pairingData);
          if (hc.connectedAccountIds?.length > 0) {
            setAccountId(hc.connectedAccountIds[0].toString());
          }
      });

      hc.disconnectionEvent.on(() => {
        console.log("Disconnection event");
        setAccountId(null);
      });

      hc.connectionStatusChangeEvent.on(connectionStatus => {
        console.log("Connection status change:", connectionStatus);
      });

      // Check if already connected
      if (hc.connectedAccountIds?.length > 0) {
        setAccountId(hc.connectedAccountIds[0].toString());
      }
    };

    setupHashConnect();
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    const { getHashConnectInstance } = await import("@/lib/hashconnect"); 
    const hc = getHashConnectInstance();
    await hc.openPairingModal();
    setIsConnecting(false);
  };

  const disconnect = async () => {
    const { getHashConnectInstance } = await import("@/lib/hashconnect"); 
    const hc = getHashConnectInstance();
    await hc.disconnect();
  };

  return (
    <div>
      {!accountId && <button onClick={connect}>Connect</button>}
      {accountId && <button onClick={disconnect}>Disconnect</button>}

      Account Id is {accountId}
    </div>
  );
}
