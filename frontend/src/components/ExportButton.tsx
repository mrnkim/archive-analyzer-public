import { Icon } from "./Icon";

type Props = {
  query: string;
  scenario?: string;
  className?: string;
};

export function ExportButton({ query, scenario, className = "" }: Props) {
  const params = new URLSearchParams({ query });
  if (scenario) params.set("scenario", scenario);
  const url = `/api/export/csv?${params.toString()}`;

  return (
    <a
      href={url}
      download
      className={
        "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-nav-item " +
        "bg-surface-white hover:bg-surface-secondary border border-border-secondary " +
        "text-foreground-muted hover:text-foreground-body transition-colors " +
        className
      }
      title="Download all timeline clips as CSV"
    >
      <Icon name="download" className="w-3.5 h-3.5" />
      <span>Export CSV</span>
    </a>
  );
}
