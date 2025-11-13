"use server";

import crypto from "crypto";
import { buildPoseidon } from "circomlibjs";
import { formatIsoToLocalString } from "@/utils/datetime";

// ✅ Eligible voters
const voters = [
  "0.0.1234",
  "0.0.5678",
  "0.0.9012",
  "0.0.3456",
  "0.0.7013264", // specific voter
];

// Server-side secret salt
const SALT = "super-secret-server-salt";

// Derive deterministic secret per voter
const deriveSecret = accountId =>
  crypto.createHash("sha256").update(`${accountId}${SALT}`).digest("hex");

// Convert accountId "0.0.x" => numeric publicKey
const accountIdToNumber = accountId => BigInt(accountId.split(".")[2]);

export interface MerkleProof {
  root: string;
  pathElements: string[];
  pathIndices: number[];
  leaf: string;
  publicKeyNumber: bigint;
  secret: bigint;
}

// ✅ Poseidon-based Merkle tree builder (consistent with Circom)
const buildPoseidonTree = (leaves, hashFn) => {
  const layers = [leaves];
  while (layers[layers.length - 1].length > 1) {
    const prev = layers[layers.length - 1];
    const next = [];
    for (let i = 0; i < prev.length; i += 2) {
      const left = prev[i];
      const right = prev[i + 1] ?? prev[i]; // duplicate last if odd
      next.push(hashFn([left, right]));
    }
    layers.push(next);
  }
  return layers;
};

// ✅ Helper to fetch messages from HCS and return parsed JSON
const getMessagesFromTopic = async (topicId: string) => {
  const baseUrl = "https://testnet.mirrornode.hedera.com";
  const url = `${baseUrl}/api/v1/topics/${topicId}/messages?limit=1000`;  
  const res = await fetch(url);
  const data = await res.json();
  const messages = (data.messages || []).map((m: any) => {
    try {
      const content = Buffer.from(m.message, "base64").toString("utf8");
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }).filter(m => m !== null);
  return messages;
};

// ✅ Main function to generate Merkle proof for a voter
export async function getMerkleProof(accountId: string): Promise<MerkleProof | null> {
  const index = voters.indexOf(accountId);
  if (index === -1) return null;

  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  const hashFn = inputs => F.toObject(poseidon(inputs));

  // Build secrets and publicKeys
  const secrets = voters.map(v => BigInt(`0x${deriveSecret(v).slice(0, 31)}`));
  const publicKeys = voters.map(v => accountIdToNumber(v));

  // Leaves = Poseidon(secret, publicKey)
  const leaves = secrets.map((s, i) => hashFn([s, publicKeys[i]]));

  // Build Merkle tree
  const treeLayers = buildPoseidonTree(leaves, hashFn);
  const root = treeLayers[treeLayers.length - 1][0];
  const leaf = leaves[index];

  // Build pathElements and pathIndices
  const pathElements = [];
  const pathIndices = [];
  let nodeIndex = index;

  for (let level = 0; level < treeLayers.length - 1; level++) {
    const layer = treeLayers[level];
    const isRight = nodeIndex % 2;
    const pairIndex = isRight ? nodeIndex - 1 : nodeIndex + 1;
    const sibling = layer[pairIndex] ?? layer[nodeIndex];
    pathElements.push(`0x${sibling.toString(16)}`);
    pathIndices.push(isRight);
    nodeIndex = Math.floor(nodeIndex / 2);
  }

  // Pad to 3 layers for circuit
  while (pathElements.length < 3) {
    pathElements.push("0x0");
    pathIndices.push(0);
  }

  // Nullifier = Poseidon(secret, pollId)
  const pollId = BigInt(1);
  const nullifier = hashFn([secrets[index], pollId]);
  // ✅ Check HCS for existing nullifier
  const existingMessages = await getMessagesFromTopic(process.env.NEXT_PUBLIC_ZK_VOTES_TOPIC_ID!);
  const existingVote = existingMessages.find(m => m.nullifier === nullifier.toString());
  if (existingVote) {
    throw new Error(`You already voted on ${formatIsoToLocalString(existingVote.timestamp)}`);
  }

  return {
    root: `0x${root.toString(16)}`,
    pathElements,
    pathIndices,
    leaf: `0x${leaf.toString(16)}`,
    publicKeyNumber: publicKeys[index],
    secret: secrets[index],
  };
}