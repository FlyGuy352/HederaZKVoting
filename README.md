# 🚀 Hedera ZK Voting  
A privacy-preserving, tamper-proof, and verifiable voting system built on **Hedera Hashgraph** using **zero-knowledge proofs (ZK)**.

This project demonstrates how on-chain consensus and off-chain cryptography can create a secure voting mechanism where **votes remain private**, yet **results remain auditable and trustless**.

---

## 🧩 How It Works
This project combines **Hedera Consensus Service** with **zero-knowledge proofs** to create a voting system that is verifiable end-to-end without exposing how any individual voted. Each eligible voter receives a position inside a **Merkle tree**, and the frontend generates a **Groth16 proof** showing the vote is valid and not duplicated. The voter's **Hedera account ID** is visible, but the ZK circuit ensures the **actual vote choice remains private**. Once submitted, every vote is immutably recorded and timestamped through HCS, enabling public auditability without sacrificing the confidentiality of individual selections.

---

## 🧠 Key Features

- 🔒 **Zero-Knowledge Proof Voting**  
  Submit a vote without revealing your identity or choice.

- 🌐 **Hedera Consensus Service (HCS)**  
  All votes are ordered and timestamped on the Hedera network.

- 📜 **Merkle Proof Verification**  
  Each voter receives a Merkle proof used to verify their eligibility.

- 🦺 **Privacy by Design**  
  No centralized server stores votes or identities.

- 🔌 **Hedera Wallet Connect Integration**  
  Connect HashPack wallet seamlessly.

- 📊 **Real-Time Vote Tally**  
  Votes update instantly using React Query and live topic messages.

---

## 🛠️ Tech Stack

### **Frontend**
- Next.js 16 (App Router)
- React + TypeScript
- TailwindCSS
- React Query

### **Blockchain & Cryptography**
- Hedera HCS
- Hedera Wallet Connect
- snarkjs (Groth16)
- Merkle Trees