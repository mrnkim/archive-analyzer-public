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
        "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md " +
        "bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 " +
        "text-neutral-200 hover:text-white transition-colors " +
        className
      }
      title="Download all timeline clips as CSV"
    >
      <Icon name="download" className="w-3.5 h-3.5" />
      <span>Export CSV</span>
    </a>
  );
}
