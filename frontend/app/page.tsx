"use client";

import { useEffect, useState } from "react";
import { AccountId, TopicMessageSubmitTransaction } from "@hashgraph/sdk";

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

  const vote = async () => {
    const { getHashConnectInstance } = await import("@/lib/hashconnect"); 
    const hc = getHashConnectInstance();
    const result = await hc.sendTransaction(
      AccountId.fromString(accountId!), new TopicMessageSubmitTransaction()
      .setTopicId(process.env.NEXT_PUBLIC_ZK_VOTES_TOPIC_ID!).setMessage("Hello")
    );
    if (result.status._code === 22) {
      alert("Success!");
    }
  };

  return (
    <div>
      {!accountId && <button onClick={connect}>Connect</button>}
      {accountId && <button onClick={disconnect}>Disconnect</button>}

      Account Id is {accountId}

      {accountId && <button onClick={vote}>Vote</button>}
    </div>
  );
}
