export type VoterMessage = {
    accountId: string;
};

export type VoteMessage = {
    choice: number;
    nullifier: string;
    timestamp: string;
};

export type MerkleProof = {
    root: string;
    pathElements: string[];
    pathIndices: number[];
    leaf: string;
    publicKeyNumber: bigint;
    secret: bigint;
};