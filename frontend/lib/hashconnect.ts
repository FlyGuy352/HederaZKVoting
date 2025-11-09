import { HashConnect } from "hashconnect";
import { LedgerId } from "@hashgraph/sdk";

const hc = new HashConnect(
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

export const getHashConnectInstance = (): HashConnect => {
    if (!hc) {
        throw new Error("HashConnect not initialized. Make sure this is called on the client side.");
    }
    return hc;
};