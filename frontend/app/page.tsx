"use client";

import { useState } from "react";
import {
  HederaSessionEvent,
  HederaJsonRpcMethod,
  DAppConnector,
  HederaChainId,
} from "@hashgraph/hedera-wallet-connect";
import { LedgerId, ContractExecuteTransaction } from "@hashgraph/sdk";
import { generateProof } from "@/utils/zk";
import contractAddresses from "@/constants/contractAddresses";

const metadata = {
  name: "zkVoting on Hedera",
  description: "Private voting dApp with zkSNARKs",
  url: "https://localhost.com",
  icons: ["https://avatars.githubusercontent.com/u/31002956"],
};

// Singleton DAppConnector instance
const dAppConnector = new DAppConnector(
  metadata,
  LedgerId.TESTNET,
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  Object.values(HederaJsonRpcMethod),
  [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
  [HederaChainId.Mainnet, HederaChainId.Testnet]
);

// Initialize once
await dAppConnector.init({ logger: "error" });

export default function HomePage() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");

  // Connect wallet
  const connectWallet = async () => {
    try {
      const connection = await dAppConnector.openModal();
      const accounts = connection.namespaces?.hedera?.accounts;
      if (accounts && accounts.length > 0) {
        const parts = accounts[0].split(":");
        const accId = parts.length === 3 ? parts[2] : null;
        setAccountId(accId);
      } else {
        console.log("No accounts detected");
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
    setConnecting(false);
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    await dAppConnector.disconnectAll();
    setAccountId(null);
    setChoice(null);
    setStatus("");
  };

  // Submit vote
  const submitVote = async () => {
    if (!accountId || choice === null) return;

    setStatus("Generating zk-proof...");
    let proofData;
    try {
      const parts = accountId.split(".");
      const secret = parseInt(parts[2], 10);
      // replace with your actual Circom proof generator
      proofData = await generateProof(choice, secret);
    } catch (error) {
      console.error(error);
      setStatus("Proof generation failed.");
      return;
    }

    setStatus("Submitting vote...");

    try {
      const tx = new ContractExecuteTransaction()
        .setContractId(contractAddresses.VotingContractId)
        .setGas(200_000)
        .setFunction("castVote", [proofData.proof, proofData.publicSignals]);

      const response = await dAppConnector.sendTransaction({
        transaction: tx,
        chainId: "hedera:testnet",
      });

      setStatus(`Vote submitted! Tx ID: ${response.transactionId}`);
    } catch (err) {
      console.error(err);
      setStatus("Vote submission failed.");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      {/* Wallet Connect Section */}
      {accountId ? (
        <>
          <p className="text-green-600 font-semibold">Connected: {accountId}</p>
          <button
            onClick={disconnectWallet}
            className="px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={connectWallet}
          disabled={connecting}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          {connecting ? "Connecting…" : "Connect Wallet"}
        </button>
      )}

      {/* Voting Section */}
      {accountId && (
        <>
          <div className="flex space-x-2 mt-4">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                className={`px-4 py-2 rounded-lg ${
                  choice === i ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
                onClick={() => setChoice(i)}
              >
                Option {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={submitVote}
            disabled={choice === null}
            className="px-4 py-2 bg-green-600 text-white rounded-lg mt-2"
          >
            Submit Vote
          </button>

          <p className="mt-2">{status}</p>
        </>
      )}
    </div>
  );
}