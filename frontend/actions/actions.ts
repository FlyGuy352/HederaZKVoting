"use server";

import crypto from "crypto";
import { buildPoseidon } from "circomlibjs";
import { formatIsoToLocalString } from "@/utils/datetime";
import { fetchTopicMessages } from "@/lib/readTopic";

const SALT = "super-secret-server-salt";

const deriveSecret = (accountId: string) =>
  crypto.createHash("sha256").update(`${accountId}${SALT}`).digest("hex");

const accountIdToNumber = (accountId: string) => BigInt(accountId.split(".")[2]);

const buildPoseidonTree = (leaves, hashFn) => {
  const layers = [leaves];
  while (layers[layers.length - 1].length > 1) {
    const prev = layers[layers.length - 1];
    const next = [];
    for (let i = 0; i < prev.length; i += 2) {
      const left = prev[i];
      const right = prev[i + 1] ?? prev[i];
      next.push(hashFn([left, right]));
    }
    layers.push(next);
  }
  return layers;
};

export async function getMerkleProof(accountId: string) {
  const voterTopic = process.env.NEXT_PUBLIC_VOTERS_REGISTRY_TOPIC_ID!;
  const voteTopic = process.env.NEXT_PUBLIC_VOTE_SUBMISSIONS_TOPIC_ID!;

  const voterMessages = await fetchTopicMessages(voterTopic);
  const voters = voterMessages.map(v => v.accountId);
  if (voters.length > 128) {
    throw new Error("Maximum number of voters have already registered");
  }
  const extendedVoters = Array.from({ length: 128 }, (_, i) => voters[i] ?? "0.0.0");
  const index = extendedVoters.indexOf(accountId);
  if (index === -1) return null;

  const poseidon = await buildPoseidon();
  const F = poseidon.F;
  const hashFn = inputs => F.toObject(poseidon(inputs));

  const secrets = extendedVoters.map(v =>
    BigInt(`0x${deriveSecret(v).slice(0, 31)}`)
  );

  const publicKeys = extendedVoters.map(v => accountIdToNumber(v));

  const leaves = secrets.map((s, i) => hashFn([s, publicKeys[i]]));

  const tree = buildPoseidonTree(leaves, hashFn);
  const root = tree[tree.length - 1][0];
  const leaf = leaves[index];

  const pathElements = [];
  const pathIndices = [];
  let node = index;

  for (let lvl = 0; lvl < tree.length - 1; lvl++) {
    const layer = tree[lvl];
    const isRight = node % 2;
    const sibling = layer[isRight ? node - 1 : node + 1] ?? layer[node];
    pathElements.push(`0x${sibling.toString(16)}`);
    pathIndices.push(isRight);
    node = Math.floor(node / 2);
  }

  while (pathElements.length < 3) {
    pathElements.push("0x0");
    pathIndices.push(0);
  }

  const pollId = BigInt(1);
  const nullifier = hashFn([secrets[index], pollId]);

  const votes = await fetchTopicMessages(voteTopic);
  const match = votes.find(m => m.nullifier === nullifier.toString());
  if (match) {
    throw new Error(
      `You already voted on ${formatIsoToLocalString(match.timestamp)}`
    );
  }

  return {
    root: `0x${root.toString(16)}`,
    pathElements,
    pathIndices,
    leaf: `0x${leaf.toString(16)}`,
    publicKeyNumber: publicKeys[index],
    secret: secrets[index]
  };
}