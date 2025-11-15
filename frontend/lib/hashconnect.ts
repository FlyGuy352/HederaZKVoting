"use client";

import type { HashConnect as HashConnectType } from "hashconnect";
import type { TopicMessageSubmitTransaction } from "@hashgraph/sdk";

let hc: HashConnectType | null = null;

export const getHashConnectInstance = async (): Promise<HashConnectType> => {
  if (hc) return hc;

  if (typeof window === "undefined") {
    throw new Error("HashConnect can only be initialized in the browser");
  }

  const { HashConnect } = await import("hashconnect");
  const { LedgerId } = await import("@hashgraph/sdk");

  hc = new HashConnect(
    LedgerId.fromString("testnet"),
    process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
    {
      name: "ZK Voting",
      description: "ZK Voting - Hedera Hashgraph DApp",
      icons: [`${window.location.origin}/favicon.ico`],
      url: window.location.origin,
    },
    true
  );

  return hc;
};

export const submitMessageTransaction = async (
  accountId: string,
  topicId: string,
  message: string
) => {
  const hcInstance = await getHashConnectInstance();
  const { AccountId, TopicMessageSubmitTransaction } = await import("@hashgraph/sdk");

  const tx: TopicMessageSubmitTransaction = new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(message);

  // cast to any because HashConnect expects its own SDK types
  const result = await hcInstance.sendTransaction(
    AccountId.fromString(accountId) as any,
    tx as any
  );

  return result;
};
