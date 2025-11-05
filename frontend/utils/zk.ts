//import * as snarkjs from "snarkjs";

export async function generateProof(vote: number, secret: number) {
  // Normally you'd use the WASM and zkey from Circom build output
  // For demonstration, this is mocked:
  const commitment = (BigInt(vote) * BigInt(secret)).toString();
  const proof = { a: "mock", b: "mock", c: "mock" };
  return { proof, commitment };
}