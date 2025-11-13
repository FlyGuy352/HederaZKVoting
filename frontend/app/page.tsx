"use client";

import { useEffect, useState } from "react";
import { AccountId, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import * as snarkjs from "snarkjs";
import { getMerkleProof } from "@/actions/actions";

export default function Home() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [voteChoice, setVoteChoice] = useState<number | null>(null);
  const [isProving, setIsProving] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [proofResult, setProofResult] = useState<any>(null);

  useEffect(() => {
    const initHashConnect = async () => {
      const { getHashConnectInstance } = await import("@/lib/hashconnect");
      const hc = getHashConnectInstance();
      await hc.init();

      hc.pairingEvent.on(() => {
        if (hc.connectedAccountIds?.length > 0)
          setAccountId(hc.connectedAccountIds[0].toString());
      });

      hc.disconnectionEvent.on(() => setAccountId(null));

      if (hc.connectedAccountIds?.length > 0)
        setAccountId(hc.connectedAccountIds[0].toString());
    };
    initHashConnect();
  }, []);

  const connect = async () => {
    const { getHashConnectInstance } = await import("@/lib/hashconnect");
    const hc = getHashConnectInstance();
    await hc.openPairingModal();
  };

  const disconnect = async () => {
    const { getHashConnectInstance } = await import("@/lib/hashconnect");
    const hc = getHashConnectInstance();
    await hc.disconnect();
  };

  const submitVote = async () => {
    if (!accountId) return alert("Connect wallet first");
    if (voteChoice === null) return alert("Select a vote");

    try {
      setIsProving(true);
      setStatus("🧮 Fetching Merkle proof...");

      const merkleProof = await getMerkleProof(accountId);
      if (!merkleProof) throw new Error("Voter not eligible");

      setStatus("🧮 Generating ZK proof...");

      const input = {
        secret: merkleProof.secret,
        publicKey: merkleProof.publicKeyNumber.toString(), // numeric for Circom
        root: merkleProof.root,
        pathElements: merkleProof.pathElements,
        pathIndices: merkleProof.pathIndices,
        choice: [
          voteChoice === 0 ? 1 : 0,
          voteChoice === 1 ? 1 : 0,
          voteChoice === 2 ? 1 : 0,
        ],
        pollId: "1",
      };

      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        "/proofs/vote_js/vote.wasm",
        "/proofs/vote_final.zkey"
      );
      const message = {
        pollId: input.pollId,
        choiceHash: publicSignals[2],
        nullifier: publicSignals[0],
        proof,
        timestamp: new Date().toISOString()
      };

      setProofResult(message);
      setStatus("📤 Submitting to Hedera...");

      const { getHashConnectInstance } = await import("@/lib/hashconnect");
      const hc = getHashConnectInstance();
      const tx = new TopicMessageSubmitTransaction()
        .setTopicId(process.env.NEXT_PUBLIC_ZK_VOTES_TOPIC_ID!)
        .setMessage(JSON.stringify(message));

      // ✅ HashConnect automatically uses connected wallet
      const result = await hc.sendTransaction(AccountId.fromString(accountId), tx);

      setStatus(
        result.status._code === 22
          ? "✅ Vote submitted successfully!"
          : `⚠️ Transaction status: ${result.status.toString()}`
      );
    } catch (error) {
      console.error(error);
      setStatus(`❌ Vote failed: ${(error as Error).message}`);
    } finally {
      setIsProving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white">
      <div className="max-w-lg w-full bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700">
        <h1 className="text-3xl font-bold mb-6 text-center">🗳️ ZK Voting</h1>

        {!accountId ? (
          <button
            onClick={connect}
            className="w-full bg-green-600 py-3 rounded-xl mb-4 hover:bg-green-500 transition"
          >
            Connect Wallet
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="w-full bg-red-600 py-3 rounded-xl mb-4 hover:bg-red-500 transition"
          >
            Disconnect ({accountId})
          </button>
        )}

        {accountId && (
          <>
            <h2 className="text-xl font-semibold mb-3">Cast Your Vote</h2>
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setVoteChoice(0)}
                className={`flex-1 py-3 rounded-xl ${
                  voteChoice === 0 ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                YES ✅
              </button>
              <button
                onClick={() => setVoteChoice(1)}
                className={`flex-1 py-3 rounded-xl ${
                  voteChoice === 1 ? "bg-red-600" : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                NO ❌
              </button>
              <button
                onClick={() => setVoteChoice(2)}
                className={`flex-1 py-3 rounded-xl ${
                  voteChoice === 2 ? "bg-yellow-600" : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                ABSTAIN ⚪
              </button>
            </div>

            <button
              onClick={submitVote}
              disabled={isProving}
              className="w-full bg-indigo-600 py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-indigo-500 transition"
            >
              {isProving ? "Generating Proof..." : "Submit Vote"}
            </button>

            {status && <p className="mt-4 text-center text-gray-300">{status}</p>}

            {proofResult && (
              <pre className="mt-4 bg-gray-900 p-4 rounded-xl max-h-60 overflow-auto text-sm">
                {JSON.stringify(proofResult, null, 2)}
              </pre>
            )}
          </>
        )}
      </div>
    </main>
  );
}