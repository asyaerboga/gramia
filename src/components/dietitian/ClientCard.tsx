"use client";

interface ClientCardProps {
  client: {
    _id: string;
    name: string;
    startWeight: number;
    currentWeight: number;
    targetWeight: number;
  };
  onViewProfile: (clientId: string) => void;
}

export default function ClientCard({ client, onViewProfile }: ClientCardProps) {
  const totalToLose = client.startWeight - client.targetWeight;
  const lost = client.startWeight - client.currentWeight;
  const percentage = totalToLose > 0 ? Math.min((lost / totalToLose) * 100, 100) : 0;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">
          {client.name.charAt(0)}
        </div>
        <h4 className="font-semibold text-gray-900">{client.name}</h4>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Hedef İlerleme</span>
          <span>%{Math.round(percentage)}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-emerald-500 h-3 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Başlangıç: {client.startWeight}kg | Güncel: {client.currentWeight}kg |
        Hedef: {client.targetWeight}kg
      </p>

      <button
        onClick={() => onViewProfile(client._id)}
        className="text-sm text-emerald-600 font-medium hover:underline"
      >
        Profile →
      </button>
    </div>
  );
}
