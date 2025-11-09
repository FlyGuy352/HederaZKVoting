pragma circom 2.2.1;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "./merkleTree.circom";

/**
 * One-hot validator
 */
template OneHot(n) {
    signal input sel[n];
    signal output ok;
    signal sum[n+1];

    sum[0] <== 0;

    for (var i = 0; i < n; i++) {
        sel[i] * (sel[i] - 1) === 0; // ensure 0 or 1
        sum[i+1] <== sum[i] + sel[i];
    }

    ok <== 1 - ((sum[n] - 1) * (sum[n] - 1)); // sum must be 1
}

/**
 * Vote Circuit
 */
template VoteCircuit(depth, nOptions) {
    // inputs
    signal input secret;           // voter's secret (private)
    signal input publicKey;        // voter public identifier
    signal input root;             // expected Merkle root
    signal input pathElements[depth];
    signal input pathIndices[depth]; // 0 or 1 bits
    signal input choice[nOptions]; // one-hot vote
    signal input pollId;           // poll id (public)

    // outputs
    signal output nullifier;     // prevents double-voting
    signal output rootOut;       // equal to root
    signal output choiceHash;    // commitment to choice

    // compute leaf = Poseidon(secret, publicKey)
    component poseLeaf = Poseidon(2);
    poseLeaf.inputs[0] <== secret;
    poseLeaf.inputs[1] <== publicKey;
    signal leaf;
    leaf <== poseLeaf.out;

    // verify Merkle membership
    component merkle = MerkleTreeInclusionProof(depth);
    merkle.leaf <== leaf;
    for (var i = 0; i < depth; i++) {
        merkle.pathElements[i] <== pathElements[i];
        merkle.pathIndices[i] <== pathIndices[i];
    }

    // safe comparison with public root
    signal rootCheck;
    rootCheck <== merkle.computedRoot;
    rootCheck === root;

    // one-hot check for choice
    component oh = OneHot(nOptions);
    for (var j = 0; j < nOptions; j++) {
        oh.sel[j] <== choice[j];
    }
    oh.ok === 1;

    // nullifier = Poseidon(secret, pollId)
    component hNull = Poseidon(2);
    hNull.inputs[0] <== secret;
    hNull.inputs[1] <== pollId;
    nullifier <== hNull.out;

    // choiceHash = Poseidon(choice vector)
    component ph = Poseidon(nOptions);
    for (var k = 0; k < nOptions; k++) {
        ph.inputs[k] <== choice[k];
    }
    choiceHash <== ph.out;

    rootOut <== root;
}

// instantiate main
component main = VoteCircuit(20, 3); // depth=20, 3 vote options