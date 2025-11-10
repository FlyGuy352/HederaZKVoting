#!/usr/bin/env bash
set -e

# Paths
FRONTEND_PROOFS_DIR="../../frontend/public/proofs"
CIRCUITS_DIR="../circuits"
PTAU_FILE="$FRONTEND_PROOFS_DIR/powersOfTau28_hez_final_16.ptau"

# Ensure output directory exists
mkdir -p $FRONTEND_PROOFS_DIR

# 1️⃣ Compile the circuit
circom $CIRCUITS_DIR/vote.circom --r1cs --wasm --sym -o $FRONTEND_PROOFS_DIR

# 2️⃣ Check for powersOfTau file, generate if missing
if [ ! -f "$PTAU_FILE" ]; then
  echo "PtAu file not found. Generating powersOfTau28_hez_final_16.ptau..."
  
  cd $FRONTEND_PROOFS_DIR
  
  # Phase 1: generate initial PtAu
  snarkjs powersoftau new bn128 16 pot16_0000.ptau -v
  
  # Contribute to the ceremony
  snarkjs powersoftau contribute pot16_0000.ptau pot16_0001.ptau --name="First contribution" -v
  
  # Prepare for phase 2 (final PtAu)
  snarkjs powersoftau prepare phase2 pot16_0001.ptau powersOfTau28_hez_final_16.ptau
  
  # Clean up intermediate files
  rm pot16_0000.ptau pot16_0001.ptau

  echo "✅ Generated $PTAU_FILE"
fi

# 3️⃣ Generate zkey and verification key
cd $FRONTEND_PROOFS_DIR

# Setup Groth16
snarkjs groth16 setup vote.r1cs powersOfTau28_hez_final_16.ptau vote_0000.zkey

# Contribute (optional)
snarkjs zkey contribute vote_0000.zkey vote_final.zkey --name="First contribution" -v

# Export verification key
snarkjs zkey export verificationkey vote_final.zkey verification_key.json

echo "✅ Build complete. Artifacts are in $FRONTEND_PROOFS_DIR"