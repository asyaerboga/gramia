interface Regions {
  neck: number;
  chest: number;
  waist: number;
  hip: number;
  arm: number;
  thigh: number;
  calf: number;
}

interface MeasurementRecord {
  _id: string;
  date: string;
  weight?: number;
  height?: number;
  regions: Regions;
}

const regionLabels: Record<keyof Regions, string> = {
  neck: "Boyun",
  chest: "Göğüs",
  waist: "Bel",
  hip: "Kalça",
  arm: "Kol",
  thigh: "Uyluk",
  calf: "Baldır",
};

interface MeasurementHistoryTableProps {
  measurements: MeasurementRecord[];
  selectedId?: string | null;
  onSelectMeasurement?: (measurement: MeasurementRecord) => void;
  onEditMeasurement?: (measurement: MeasurementRecord) => void;
  onDeleteMeasurement?: (measurement: MeasurementRecord) => void;
}

export default function MeasurementHistoryTable({
  measurements,
  selectedId,
  onSelectMeasurement,
  onEditMeasurement,
  onDeleteMeasurement,
}: MeasurementHistoryTableProps) {
  const showActions = Boolean(onEditMeasurement || onDeleteMeasurement);
  if (measurements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <span className="text-4xl mb-2">🗓️</span>
        <p className="text-gray-400 text-sm">Henüz ölçüm kaydı yok.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 pr-4 text-xs text-gray-400 font-semibold uppercase tracking-wide">Tarih</th>
            <th className="text-center py-2 px-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">Kilo</th>
            <th className="text-center py-2 px-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">Boy</th>
            {Object.values(regionLabels).map((label) => (
              <th key={label} className="text-center py-2 px-2 text-xs text-gray-400 font-semibold uppercase tracking-wide whitespace-nowrap">
                {label}
              </th>
            ))}
            {showActions && (
              <th className="text-center py-2 pl-2 text-xs text-gray-400 font-semibold uppercase tracking-wide whitespace-nowrap">
                İşlem
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {[...measurements].reverse().map((m, i) => {
            const isSelected = selectedId ? m._id === selectedId : i === 0;
            return (
            <tr
              key={m._id}
              onClick={() => onSelectMeasurement?.(m)}
              className={`border-b border-gray-50 transition-colors ${onSelectMeasurement ? "cursor-pointer" : ""} ${
                isSelected ? "bg-emerald-50/70" : "hover:bg-gray-50/50"
              }`}
            >
              <td className="py-2 pr-4 font-medium text-gray-700 whitespace-nowrap">
                {i === 0 && (
                  <span className="inline-block text-[10px] font-bold bg-emerald-100 text-emerald-600 rounded-full px-2 py-0.5 mr-2">YENİ</span>
                )}
                {new Date(m.date).toLocaleDateString("tr-TR")}
              </td>
              <td className="text-center py-2 px-2 text-blue-600 font-semibold">
                {m.weight != null ? `${m.weight}` : "—"}
              </td>
              <td className="text-center py-2 px-2 text-emerald-600 font-semibold">
                {m.height != null ? `${m.height}` : "—"}
              </td>
              {(Object.keys(regionLabels) as (keyof Regions)[]).map((key) => (
                <td key={key} className="text-center py-2 px-2 text-gray-600">
                  {m.regions[key] > 0 ? m.regions[key] : "—"}
                </td>
              ))}
              {showActions && (
                <td className="text-center py-2 pl-2 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    {onEditMeasurement && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditMeasurement(m);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                        title="Düzenle"
                      >
                        ✏️
                      </button>
                    )}
                    {onDeleteMeasurement && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMeasurement(m);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Sil"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
