import { Client, TopicCreateTransaction } from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config();

const client = Client.forTestnet()
  .setOperator(process.env.OPERATOR_ID, process.env.OPERATOR_KEY);

// Create Voter Registry Topic
const voterRegistryTx = await new TopicCreateTransaction()
  .setTopicMemo("ZK Voting - Voter Registry")
  .execute(client);
const voterRegistryTxReceipt = await voterRegistryTx.getReceipt(client);
const voterRegistryTopicId = voterRegistryTxReceipt.topicId;
console.log(`\n🗳️ Voter Registry Topic created: ${voterRegistryTopicId.toString()}`);

// Create Vote Submissions Topic
const voteSubmissionsTx = await new TopicCreateTransaction()
  .setTopicMemo("ZK Voting - Vote Submissions")
  .execute(client);

const voteSubmissionsTxReceipt = await voteSubmissionsTx.getReceipt(client);
const voteSubmissionsTopicId = voteSubmissionsTxReceipt.topicId;

console.log(`\n🧾 Vote Submissions Topic created: ${voteSubmissionsTopicId.toString()}`);