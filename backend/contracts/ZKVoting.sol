// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "./Verifier.sol";

contract ZKVoting {
    Verifier public verifier;

    struct Vote {
        bytes32 nullifier;
        bytes32 choiceHash;
        bool used;
    }

    mapping(bytes32 => bool) public nullifierUsed;
    mapping(bytes32 => Vote) public votes;

    event VoteCast(bytes32 indexed nullifier, bytes32 choiceHash);

    constructor(address _verifier) {
        verifier = Verifier(_verifier);
    }

    function castVote(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[] memory input
    ) external {
        require(verifier.verifyProof(a, b, c, input), "Invalid proof");

        bytes32 nullifier = bytes32(input[2]);
        bytes32 choiceHash = bytes32(input[3]);

        require(!nullifierUsed[nullifier], "Already voted");
        nullifierUsed[nullifier] = true;

        votes[nullifier] = Vote(nullifier, choiceHash, true);
        emit VoteCast(nullifier, choiceHash);
    }
}
