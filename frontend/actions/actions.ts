"use server";

import crypto from "crypto";
import { buildPoseidon } from "circomlibjs";
import { formatIsoToLocalString } from "@/utils/datetime";
import { fetchTopicMessages } from "@/lib/readTopic";
import { VoterMessage, VoteMessage, MerkleProof, MerkleProofResult } from "@/types/types";

const SALT = "super-secret-server-salt";

type HashFn = (inputs: bigint[]) => bigint;

const deriveSecret = (accountId: string): string =>
  crypto.createHash("sha256").update(`${accountId}${SALT}`).digest("hex");

const accountIdToNumber = (accountId: string): bigint =>
  BigInt(accountId.split(".")[2] ?? 0);

const buildPoseidonTree = (leaves: bigint[], hashFn: HashFn): bigint[][] => {
  const layers: bigint[][] = [leaves];
  while (layers[layers.length - 1].length > 1) {
    const prev = layers[layers.length - 1];
    const next: bigint[] = [];
    for (let i = 0; i < prev.length; i += 2) {
      const left = prev[i];
      const right = prev[i + 1] ?? prev[i];
      next.push(hashFn([left, right]));
    }
    layers.push(next);
  }
  return layers;
};

export async function getMerkleProof(accountId: string): Promise<MerkleProofResult> {
  const voterTopic = process.env.NEXT_PUBLIC_VOTERS_REGISTRY_TOPIC_ID!;
  const voteTopic = process.env.NEXT_PUBLIC_VOTE_SUBMISSIONS_TOPIC_ID!;

  const voterMessages = (await fetchTopicMessages(voterTopic)) as VoterMessage[];
  const voters = voterMessages.map(v => v.accountId);
  if (voters.length > 128) {
    return { success: false, errorMessage: "Maximum number of voters have already registered" };
  }

  const extendedVoters = Array.from(
    { length: 128 },
    (_, i) => voters[i] ?? "0.0.0"
  );

  const index = extendedVoters.indexOf(accountId);
  if (index === -1) return { success: false, errorMessage: "You are not registered as a voter" };

  const poseidon = await buildPoseidon();
  const F = poseidon.F;
  const hashFn: HashFn = inputs => F.toObject(poseidon(inputs));

  const secrets = extendedVoters.map(
    v => BigInt(`0x${deriveSecret(v).slice(0, 31)}`)
  );

  const publicKeys = extendedVoters.map(accountIdToNumber);

  const leaves = secrets.map((s, i) => hashFn([s, publicKeys[i]]));

  const tree = buildPoseidonTree(leaves, hashFn);
  const root = tree[tree.length - 1][0];
  const leaf = leaves[index];

  const pathElements: string[] = [];
  const pathIndices: number[] = [];

  let node = index;

  for (let lvl = 0; lvl < tree.length - 1; lvl++) {
    const layer = tree[lvl];
    const isRight = node % 2;
    const sibling = layer[isRight ? node - 1 : node + 1] ?? layer[node];
    pathElements.push(`0x${sibling.toString(16)}`);
    pathIndices.push(isRight);
    node = Math.floor(node / 2);
  }

  while (pathElements.length < 7) {
    pathElements.push("0x0");
    pathIndices.push(0);
  }

  const pollId = BigInt(1);
  const nullifier = hashFn([secrets[index], pollId]);

  const votes = (await fetchTopicMessages(voteTopic)) as VoteMessage[];
  const match = votes.find(v => v.nullifier === nullifier.toString());
  if (match) {
    return { success: false, errorMessage: `You already voted on ${formatIsoToLocalString(match.timestamp)}` };
  }

  return {
    success: true,
    proof: {
      root: `0x${root.toString(16)}`,
      pathElements,
      pathIndices,
      leaf: `0x${leaf.toString(16)}`,
      publicKeyNumber: publicKeys[index],
      secret: secrets[index]
    }
  };
};