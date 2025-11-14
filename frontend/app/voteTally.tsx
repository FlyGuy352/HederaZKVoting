type VoteCounts = {
  yes: number;
  no: number;
  abstain: number;
};

export default function VoteTally({ voteCounts }: { voteCounts: VoteCounts }) {
  return (
    <div className="mt-12 p-4 bg-gray-700 rounded-2xl shadow-inner text-center">
      <h3 className="text-lg font-semibold mb-3">📊 Current Votes</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-600 rounded-xl p-3 flex flex-col items-center justify-center">
          <span className="text-white font-bold text-xl">{voteCounts.yes}</span>
          <span className="text-white text-sm">YES ✅</span>
        </div>
        <div className="bg-red-600 rounded-xl p-3 flex flex-col items-center justify-center">
          <span className="text-white font-bold text-xl">{voteCounts.no}</span>
          <span className="text-white text-sm">NO ❌</span>
        </div>
        <div className="bg-yellow-500 rounded-xl p-3 flex flex-col items-center justify-center">
          <span className="text-white font-bold text-xl">{voteCounts.abstain}</span>
          <span className="text-white text-sm">ABSTAIN ⚪</span>
        </div>
      </div>
    </div>
  );
}