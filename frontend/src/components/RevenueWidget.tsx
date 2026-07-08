type Props = {
  totalMentions: number;
  estimatedValueUsd: number;
  basis: string;
};

function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

export function RevenueWidget({ totalMentions, estimatedValueUsd, basis }: Props) {
  const assumedUnitValue =
    totalMentions > 0 ? estimatedValueUsd / totalMentions : 0;

  return (
    <div className="bg-neutral-900 border border-brand-900/50 rounded-lg p-4 overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-brand-500">
            Archive monetization estimate
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Modeled from verified scene count and a per-scene licensing assumption.
          </p>
        </div>
        <div className="text-right flex-none">
          <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
            estimate
          </div>
          <div className="text-2xl font-semibold text-neutral-100 tabular-nums">
            {formatCurrency(estimatedValueUsd)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-2">
        <div className="rounded-md border border-neutral-800 bg-neutral-950/60 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
            evidence
          </div>
          <div className="mt-1 text-lg font-semibold text-neutral-100 tabular-nums">
            {totalMentions.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500">scenes</div>
        </div>

        <div className="flex items-center justify-center text-neutral-600 font-mono">
          x
        </div>

        <div className="rounded-md border border-neutral-800 bg-neutral-950/60 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
            assumption
          </div>
          <div className="mt-1 text-lg font-semibold text-neutral-100 tabular-nums">
            {formatCurrency(assumedUnitValue)}
          </div>
          <div className="text-[11px] text-neutral-500">per scene</div>
        </div>

        <div className="flex items-center justify-center text-neutral-600 font-mono">
          =
        </div>

        <div className="rounded-md border border-brand-800/70 bg-brand-500/10 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.14em] text-brand-500">
            modeled value
          </div>
          <div className="mt-1 text-lg font-semibold text-neutral-50 tabular-nums">
            {formatCurrency(estimatedValueUsd)}
          </div>
          <div className="text-[11px] text-neutral-400">total</div>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-neutral-800 bg-neutral-950/40 px-3 py-2">
        <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 mb-1">
          calculation basis
        </div>
        <p className="text-xs leading-5 text-neutral-400">{basis}</p>
      </div>
    </div>
  );
}
