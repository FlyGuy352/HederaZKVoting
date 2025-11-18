import { useQuery } from "@tanstack/react-query";
import { fetchTopicMessages } from "@/lib/readTopic";
import { VoterMessage } from "@/types/types";

export default function useIsRegisteredVoter(accountId: string) {
    return useQuery({
        queryKey: ["isRegisteredVoter", accountId],
        queryFn: async () => {
            const messages = (await fetchTopicMessages(process.env.NEXT_PUBLIC_VOTERS_REGISTRY_TOPIC_ID!)) as VoterMessage[];
            return messages.some(message => message.accountId === accountId);
        },
        refetchOnWindowFocus: false,
        enabled: accountId !== undefined
    });
}