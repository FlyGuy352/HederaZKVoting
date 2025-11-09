import { Client, TopicCreateTransaction } from "@hashgraph/sdk";

import dotenv from "dotenv";
dotenv.config();

const client = Client.forTestnet()
    .setOperator(process.env.OPERATOR_ID, process.env.OPERATOR_KEY);

const txResponse = await new TopicCreateTransaction()
    .setTopicMemo("ZK Votes Topic")
    .execute(client);

const receipt = await txResponse.getReceipt(client);
const topicId = receipt.topicId;

console.log(`\nTopic created: ${topicId.toString()}`);