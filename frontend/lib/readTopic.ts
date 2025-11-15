export async function fetchTopicMessages<T>(topicId: string): Promise<T[]> {
  const url = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=1000`;
  const res = await fetch(url);
  const data = await res.json();

  return (data.messages || [])
    .map((m: any) => {
      try {
        const decoded = Buffer.from(m.message, "base64").toString("utf8");

        // First parse (outer string)
        const first = JSON.parse(decoded);

        // Second parse (inner actual object)
        const second = typeof first === "string" ? JSON.parse(first) : first;

        return second as T;
      } catch {
        return null;
      }
    })
    .filter((item: any): item is T => item !== null);
}