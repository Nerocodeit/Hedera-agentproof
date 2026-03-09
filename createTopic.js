require("dotenv").config();

const {
  Client,
  AccountId,
  PrivateKey,
  TopicCreateTransaction
} = require("@hashgraph/sdk");

async function createTopic() {
  try {
    const client = Client.forTestnet();

    client.setOperator(
      AccountId.fromString(process.env.HEDERA_ACCOUNT_ID),
      PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY)
    );

    const tx = await new TopicCreateTransaction().execute(client);
    const receipt = await tx.getReceipt(client);

    console.log("✅ Topic Created!");
    console.log("Topic ID:", receipt.topicId.toString());
  } catch (error) {
    console.error("Error creating topic:", error);
  }
}

createTopic();