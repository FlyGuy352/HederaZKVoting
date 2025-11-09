pragma circom 2.2.1;

include "../node_modules/circomlib/circuits/poseidon.circom";

/**
 * Selector template: chooses between two values based on a boolean
 * sel = 0 → out = alt
 * sel = 1 → out = in
 */
template Selector() {
    signal input in;
    signal input alt;
    signal input sel;  // must be 0 or 1
    signal output out;

    // enforce boolean
    sel * (sel - 1) === 0;

    // intermediate signals
    signal t1;
    signal t2;

    t1 <== sel * in;
    t2 <== (1 - sel) * alt;
    out <== t1 + t2;
}

/**
 * Merkle Tree Inclusion Proof
 * depth: height of the tree
 * Inputs:
 *  - leaf: hash of the voter
 *  - pathElements: sibling nodes along the path
 *  - pathIndices: 0 if current node is left, 1 if right
 * Output:
 *  - computedRoot: root of the tree
 */
template MerkleTreeInclusionProof(depth) {
    signal input leaf;
    signal input pathElements[depth];
    signal input pathIndices[depth];

    signal output computedRoot;

    signal current[depth + 1];
    component hashers[depth];
    component selLeft[depth];
    component selRight[depth];

    current[0] <== leaf;

    for (var i = 0; i < depth; i++) {
        hashers[i] = Poseidon(2);
        selLeft[i] = Selector();
        selRight[i] = Selector();

        // boolean check for pathIndices[i] is inside Selector

        // left = if sel=1 then pathElements[i] else current[i]
        selLeft[i].in <== pathElements[i];
        selLeft[i].alt <== current[i];
        selLeft[i].sel <== pathIndices[i];

        // right = if sel=1 then current[i] else pathElements[i]
        selRight[i].in <== current[i];
        selRight[i].alt <== pathElements[i];
        selRight[i].sel <== pathIndices[i];

        // hash the children
        hashers[i].inputs[0] <== selLeft[i].out;
        hashers[i].inputs[1] <== selRight[i].out;
        current[i + 1] <== hashers[i].out;
    }

    computedRoot <== current[depth];
}