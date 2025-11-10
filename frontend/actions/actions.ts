import { MerkleTree } from "merkletreejs";
import crypto from "crypto";

// ✅ Eligible voters
const voters = [
  "0.0.1234",
  "0.0.5678",
  "0.0.9012",
  "0.0.3456",
  "0.0.7013264", // your specific voter
];

// Server-side secret salt
const SALT = "super-secret-server-salt";

// SHA256 hashing function (placeholder for Poseidon if needed)
const hashFn = (data: Buffer) => crypto.createHash("sha256").update(data).digest();

// Derive deterministic secret per voter
const deriveSecret = (accountId: string) =>
  crypto.createHash("sha256").update(accountId + SALT).digest("hex");

// Convert accountId "0.0.x" => numeric publicKey
const accountIdToNumber = (accountId: string) => BigInt(accountId.split(".")[2]);

export interface MerkleProof {
  root: string;
  pathElements: string[];
  pathIndices: number[];
  leaf: string;
  nullifier: string;
  publicKeyNumber: bigint;
}

// Generate Merkle proof for a voter
export async function getMerkleProof(accountId: string): Promise<MerkleProof | null> {
  const index = voters.indexOf(accountId);
  if (index === -1) {
    return null;
  }

  const secrets = voters.map(v => deriveSecret(v));
  const publicKeys = voters.map(v => accountIdToNumber(v));

  // Leaves = hash(secret + numeric publicKey)
  const leaves = secrets.map((s, i) =>
    hashFn(Buffer.from(s + publicKeys[i].toString()))
  );

  const tree = new MerkleTree(leaves, hashFn, { sortPairs: true });
  const leaf = leaves[index];
  const proof = tree.getProof(leaf);

  const pathElements = proof.map(p => `0x${p.data.toString("hex")}`);
  const pathIndices = proof.map(p => (p.position === "left" ? 0 : 1));

  const nullifier = hashFn(Buffer.from(secrets[index] + "1")).toString("hex");

  return {
    root: `0x${tree.getRoot().toString("hex")}`,
    pathElements,
    pathIndices,
    leaf: `0x${leaf.toString("hex")}`,
    nullifier: `0x${nullifier}`,
    publicKeyNumber: publicKeys[index],
  };
}