import { LedgerId, AccountId, TopicMessageSubmitTransaction } from "@hashgraph/sdk";

let hc;
if (typeof window !== "undefined") {
    const { HashConnect } = await import("hashconnect");
    hc = new HashConnect(
        LedgerId.fromString("testnet"),
        process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!, // projectId
        {
            name: "ZK Voting",
            description: "ZK Voting - Hedera Hashgraph DApp",
            icons: [`${window.location.origin}/favicon.ico`],
            url: "http://localhost:3000",
        },
        true
    );
}

export const getHashConnectInstance = (): HashConnect => {
    if (!hc) {
        throw new Error("HashConnect not initialized. Make sure this is called on the client side.");
    }
    return hc;
};

export const submitMessageTransaction = async (accountId: string, topicId: string, message: string) => {
    const hc = getHashConnectInstance();

    const tx = new TopicMessageSubmitTransaction()
      .setTopicId(process.env.NEXT_PUBLIC_VOTE_SUBMISSIONS_TOPIC_ID!)
      .setMessage(JSON.stringify(message));

    const result = await hc.sendTransaction(
      AccountId.fromString(accountId),
      tx
    );
    return result;
};