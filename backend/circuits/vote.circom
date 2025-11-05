pragma circom 2.2.3;

template OneHot(n) {
    signal input sel[n];
    signal output ok;
    signal sum = 0;
    for (var i = 0; i < n; i++) {
        sum += sel[i];
        sel[i] * (sel[i] - 1) === 0; // each sel is 0 or 1
    }
    ok <== (sum === 1) ? 1 : 0;
}


template VoteCircuit(depth, nOptions) {
// inputs
    signal input secret; // voter's secret (private)
    signal input publicKey; // voter public identifier (we'll hash with secret in registry)
    signal input root; // Merkle root of eligible voters (public)
    signal input pathElements[depth];
    signal input pathIndices[depth]; // 0 or 1 bits

    // vote choice as one-hot of nOptions
    signal input choice[nOptions];

    // poll id (public)
    signal input pollId;

    // outputs
    signal output nullifier; // public nullifier to prevent double-voting
    signal output rootOut; // equal to root (so root can be public)
    signal output choiceHash; // a commitment to choice (optional)

    // compute leaf = Poseidon(secret, publicKey)
    component poseLeaf = Poseidon(2);
    poseLeaf.inputs[0] <== secret;
    poseLeaf.inputs[1] <== publicKey;
    signal leaf = poseLeaf.out;

    // verify merkle membership
    component merkle = MerkleTreeInclusionProof(depth);
    merkle.leaf <== leaf;
    for (var i=0; i<depth; i++) {
        merkle.pathElements[i] <== pathElements[i];
        merkle.pathIndices[i] <== pathIndices[i];
    }
    merkle.root === root; // enforce membership

    // one-hot check for choice
    component oh = OneHot(nOptions);
    for (var j=0; j<nOptions; j++) {
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
    for (var k=0; k<nOptions; k++) {
        ph.inputs[k] <== choice[k];
    }
    choiceHash <== ph.out;

    rootOut <== root;
}

component main = VoteCircuit(20, 3);