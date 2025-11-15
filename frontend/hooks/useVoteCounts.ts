import { useQuery } from "@tanstack/react-query";
import { fetchTopicMessages } from "@/lib/readTopic";
import { VoteMessage } from "@/types/types";

export default function useVoteCounts() {
    return useQuery({
        queryKey: ["voteCounts"],
        queryFn: async () => {
            const messages = (await fetchTopicMessages(process.env.NEXT_PUBLIC_VOTE_SUBMISSIONS_TOPIC_ID!)) as VoteMessage[];
            const counts = { yes: 0, no: 0, abstain: 0 };

            for (const v of messages) {
                switch (v.choice) {
                    case 0:
                        counts.yes++;
                        break;
                    case 1:
                        counts.no++;
                        break;
                    case 2:
                        counts.abstain++;
                        break;
                    default:
                        break;
                }
            }
            return counts;
        },
        refetchOnWindowFocus: false
    });
}