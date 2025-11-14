export const fetchTopicMessages = async topicId => {
  const url = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=1000`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.messages || [])
    .map(m => {
      try {
        const decoded = Buffer.from(m.message, "base64").toString("utf8");
        return JSON.parse(decoded);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};