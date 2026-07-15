type Props = {
  totalMentions: number;
  estimatedValueUsd: number;
  basis: string;
  // The Retroactive Discovery / COVID tab ("V") reframes the same numbers for
  // its buyer (researchers, documentary producers). Other tabs leave it unset.
  scenario?: string;
};

function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

export function RevenueWidget({ totalMentions, estimatedValueUsd, basis, scenario }: Props) {
  const assumedUnitValue =
    totalMentions > 0 ? estimatedValueUsd / totalMentions : 0;
  const isRetro = (scenario ?? "").toUpperCase() === "V";
  const heading = isRetro ? "Retroactive discovery value" : "Archive monetization estimate";
  const subtitle = isRetro
    ? "What pandemic researchers & documentary producers would license this pre-terminology footage for."
    : "Modeled from verified scene count and a per-scene licensing assumption.";

  return (
    <div className="bg-surface-white border border-border-secondary rounded-tlds-3 p-4 overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-foreground-body">{heading}</h3>
          <p className="text-xs text-foreground-subtle mt-1">{subtitle}</p>
        </div>
        <div className="text-right flex-none">
          <div className="text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
            estimate
          </div>
          <div className="text-2xl font-semibold text-foreground-body tabular-nums">
            {formatCurrency(estimatedValueUsd)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-2">
        <div className="rounded-nav-item border border-border-secondary bg-[color-mix(in_srgb,var(--tl-surface-body)_60%,transparent)] px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
            evidence
          </div>
          <div className="mt-1 text-lg font-semibold text-foreground-body tabular-nums">
            {totalMentions.toLocaleString()}
          </div>
          <div className="text-[11px] text-foreground-subtle">scenes</div>
        </div>

        <div className="flex items-center justify-center text-foreground-subtle font-tl-mono">
          x
        </div>

        <div className="rounded-nav-item border border-border-secondary bg-[color-mix(in_srgb,var(--tl-surface-body)_60%,transparent)] px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
            assumption
          </div>
          <div className="mt-1 text-lg font-semibold text-foreground-body tabular-nums">
            {formatCurrency(assumedUnitValue)}
          </div>
          <div className="text-[11px] text-foreground-subtle">per scene</div>
        </div>

        <div className="flex items-center justify-center text-foreground-subtle font-tl-mono">
          =
        </div>

        <div className="rounded-nav-item border border-border-secondary bg-surface-secondary px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.14em] text-foreground-muted">
            modeled value
          </div>
          <div className="mt-1 text-lg font-semibold text-foreground-body tabular-nums">
            {formatCurrency(estimatedValueUsd)}
          </div>
          <div className="text-[11px] text-foreground-subtle">total</div>
        </div>
      </div>

      <div className="mt-3 rounded-nav-item border border-border-secondary bg-[color-mix(in_srgb,var(--tl-surface-body)_40%,transparent)] px-3 py-2">
        <div className="text-[10px] uppercase tracking-[0.14em] text-foreground-subtle mb-1">
          calculation basis
        </div>
        <p className="text-xs leading-5 text-foreground-subtle">{basis}</p>
      </div>
    </div>
  );
}
