"use server";

import { groth16 } from "snarkjs";
import { poseidon } from "circomlibjs";
import { ContractExecuteTransaction, Client } from "@hashgraph/sdk";
import contractAddresses from "@/constants/contractAddresses.json";

export async function submitVote(inputs: any) {
    const { proof, publicSignals } = await groth16.fullProve(
        inputs,
        "circuits/build/vote.wasm",
        "circuits/build/vote.zkey"
    );

    const client = Client.forTestnet();
    client.setOperator(process.env.HEDERA_ACCOUNT_ID!, process.env.HEDERA_PRIVATE_KEY!);

    const tx = await new ContractExecuteTransaction()
        .setContractId(contractAddresses.VotingContractId)
        .setGas(1_000_000)
        .setFunctionParameters({ proof, publicSignals })
        .execute(client);

    return { receipt: await tx.getReceipt(client) };
}