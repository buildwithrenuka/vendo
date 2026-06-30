import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type Block =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; nodes: ReactNode[] }
  | { type: "ul"; items: ReactNode[][] }
  | { type: "ol"; items: ReactNode[][] }
  | { type: "code"; lang: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "blockquote"; nodes: ReactNode[] }
  | { type: "hr" };

function inlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={`${keyPrefix}-b${i++}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={`${keyPrefix}-c${i++}`} className="docs-inline-code">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("[")) {
      const label = token.slice(1, token.indexOf("]("));
      const href = token.slice(token.indexOf("(") + 1, -1);
      const internal = href.startsWith("/") && !href.startsWith("//");
      nodes.push(
        internal ? (
          <Link key={`${keyPrefix}-l${i++}`} to={href} className="docs-link">
            {label}
          </Link>
        ) : (
          <a key={`${keyPrefix}-a${i++}`} href={href} className="docs-link" target="_blank" rel="noreferrer">
            {label}
          </a>
        ),
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length ? nodes : [text];
}

function parseTable(lines: string[]): { headers: string[]; rows: string[][] } {
  const headers = lines[0]
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean);
  const rows = lines.slice(2).map((line) =>
    line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean),
  );
  return { headers, rows };
}

function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", lang, code: codeLines.join("\n") });
      i++;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push({ type: "h1", text: line.slice(2).trim() });
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.slice(4).trim() });
      i++;
      continue;
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: "blockquote", nodes: inlineMarkdown(quoteLines.join(" "), `q${i}`) });
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "table", ...parseTable(tableLines) });
      continue;
    }

    if (line.startsWith("- ")) {
      const items: ReactNode[][] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(inlineMarkdown(lines[i].slice(2), `li${i}`));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: ReactNode[][] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(inlineMarkdown(lines[i].replace(/^\d+\.\s/, ""), `ol${i}`));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    if (line.trim() === "---") {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("#") && !lines[i].startsWith("```") && !lines[i].startsWith("|") && !lines[i].startsWith("- ") && !lines[i].startsWith("> ") && !/^\d+\.\s/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", nodes: inlineMarkdown(para.join(" "), `p${i}`) });
  }

  return blocks;
}

export function MarkdownDoc({ source }: { source: string }) {
  const blocks = parseMarkdown(source);

  return (
    <article className="docs-prose">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "h1":
            return <h1 key={idx}>{block.text}</h1>;
          case "h2":
            return <h2 key={idx}>{block.text}</h2>;
          case "h3":
            return <h3 key={idx}>{block.text}</h3>;
          case "p":
            return <p key={idx}>{block.nodes}</p>;
          case "ul":
            return (
              <ul key={idx}>
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={idx}>
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ol>
            );
          case "code":
            return (
              <pre key={idx} className="docs-code-block">
                <code>{block.code}</code>
              </pre>
            );
          case "table":
            return (
              <div key={idx} className="docs-table-wrap">
                <table className="docs-table">
                  <thead>
                    <tr>
                      {block.headers.map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "blockquote":
            return <blockquote key={idx}>{block.nodes}</blockquote>;
          case "hr":
            return <hr key={idx} className="docs-hr" />;
          default:
            return null;
        }
      })}
    </article>
  );
}
