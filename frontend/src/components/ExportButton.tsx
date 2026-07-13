import { Button, DownloadIcon } from "@twelvelabs-io/react";

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
    <Button asChild variant="outlined-gray" size="sm" className={className}>
      <a href={url} download title="Download all timeline clips as CSV">
        <DownloadIcon className="size-3.5" />
        Export CSV
      </a>
    </Button>
  );
}
