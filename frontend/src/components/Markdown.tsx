import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Generative responses occasionally embed citations as
 * `<vref id="..." start="HH:MM" end="HH:MM"></vref>` inline tags. We strip
 * them to a readable italicized hint instead of letting raw HTML through.
 */
function preprocessCitations(text: string): string {
  return text.replace(
    /<vref\s+id="([^"]+)"(?:\s+start="([^"]*)")?(?:\s+end="([^"]*)")?\s*>\s*<\/vref>/g,
    (_match, _id, start, end) => {
      if (start && end) return ` *(clip ${start}–${end})*`;
      if (start) return ` *(clip @${start})*`;
      return "";
    }
  );
}

type Props = {
  children: string;
  className?: string;
};

export function Markdown({ children, className = "" }: Props) {
  const cleaned = preprocessCitations(children);
  return (
    <div
      className={
        "text-neutral-100 leading-relaxed " +
        "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 " +
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 " +
        "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 " +
        "[&_li]:my-0.5 " +
        "[&_strong]:font-semibold [&_strong]:text-neutral-50 " +
        "[&_em]:text-neutral-300 [&_em]:italic " +
        "[&_code]:bg-neutral-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs " +
        "[&_h1]:text-base [&_h1]:font-semibold [&_h1]:mt-3 [&_h1]:mb-1 " +
        "[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 " +
        "[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 " +
        "[&_table]:my-2 [&_table]:text-xs [&_th]:font-semibold [&_th]:text-left [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_th]:border-b [&_th]:border-neutral-700 " +
        "[&_a]:text-[#60E21C] [&_a]:underline " +
        className
      }
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleaned}</ReactMarkdown>
    </div>
  );
}
