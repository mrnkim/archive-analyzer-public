type Props = {
  totalMentions: number;
  estimatedValueUsd: number;
  basis: string;
};

export function RevenueWidget({ totalMentions, estimatedValueUsd, basis }: Props) {
  return (
    <div className="bg-gradient-to-br from-brand-900/40 to-neutral-900 border border-brand-900/50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-brand-500 mb-2">Archive monetization estimate</h3>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-neutral-100">
          ${estimatedValueUsd.toLocaleString()}
        </span>
        <span
          className="text-xs text-neutral-400"
          title="Total scenes counted across the timeline"
        >
          ({totalMentions.toLocaleString()} scenes)
        </span>
      </div>
      <p className="text-xs text-neutral-500 mt-2">{basis}</p>
    </div>
  );
}
