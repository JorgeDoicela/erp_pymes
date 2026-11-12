/**
 * @file legalAssistantMarkdown.jsx
 * @description Renderizador seguro y estilizado de Markdown legal (encabezados, listas, código y tablas NIIF).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

function renderCodeSegments(text) {
  const segments = String(text).split(/(`[^`]+`)/g);
  return segments.map((seg, i) => {
    if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded-[3px] font-mono text-[11px] text-gray-900 tabular-nums"
        >
          {seg.slice(1, -1)}
        </code>
      );
    }
    return seg;
  });
}

export function renderInlineFormatting(text) {
  if (!text) return null;
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-gray-900">
          {renderCodeSegments(part.slice(2, -2))}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded-[3px] font-mono text-[11px] text-gray-900 tabular-nums"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-gray-700">
          {renderCodeSegments(part.slice(1, -1))}
        </em>
      );
    }
    return part;
  });
}

function parseTableRows(lines, startIndex) {
  const rows = [];
  let i = startIndex;
  while (i < lines.length && lines[i].trim().startsWith('|')) {
    const rawLine = lines[i].trim();
    if (!/^\|(?:\s*:?-+:?\s*\|)+$/.test(rawLine)) {
      const cells = rawLine
        .slice(1, rawLine.endsWith('|') ? -1 : undefined)
        .split('|')
        .map((c) => c.trim());
      rows.push(cells);
    }
    i++;
  }
  return { rows, nextIndex: i };
}

export function renderFormattedLegalText(content) {
  if (!content) return null;
  const rawLines = String(content).split('\n');
  const elements = [];
  let i = 0;

  while (i < rawLines.length) {
    const rawLine = rawLines[i];
    const line = rawLine.trim();

    if (!line) {
      elements.push(<div key={`empty-${i}`} className="h-1" />);
      i++;
      continue;
    }

    if (line.startsWith('|')) {
      const { rows, nextIndex } = parseTableRows(rawLines, i);
      if (rows.length > 0) {
        const [headers, ...dataRows] = rows;
        elements.push(
          <div
            key={`table-${i}`}
            className="my-2 overflow-x-auto border border-gray-200 rounded-[4px]"
          >
            <table className="w-full text-left text-[11px] border-collapse bg-white">
              {headers && (
                <thead className="bg-[#f9fafb] border-b border-gray-200">
                  <tr>
                    {headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="px-2.5 py-1.5 font-semibold text-gray-700 font-mono"
                      >
                        {renderInlineFormatting(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-gray-100">
                {dataRows.map((r, rIdx) => (
                  <tr key={rIdx} className="hover:bg-gray-50/50">
                    {r.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`px-2.5 py-1.5 text-gray-800 ${
                          cIdx > 0 ? 'font-mono tabular-nums' : ''
                        }`}
                      >
                        {renderInlineFormatting(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      i = nextIndex;
      continue;
    }

    if (/^-{3,}$/.test(line)) {
      elements.push(<hr key={`hr-${i}`} className="my-2 border-gray-200" />);
      i++;
      continue;
    }

    if (/^#{1,4}\s+/.test(line)) {
      elements.push(
        <h4 key={`heading-${i}`} className="font-semibold text-gray-900 text-xs pt-1">
          {renderInlineFormatting(line.replace(/^#{1,4}\s+/, ''))}
        </h4>
      );
      i++;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-1.5 pl-1">
          <span className="text-gray-400 select-none">•</span>
          <span className="flex-1">{renderInlineFormatting(line.replace(/^[-*]\s+/, ''))}</span>
        </div>
      );
      i++;
      continue;
    }

    elements.push(<div key={`p-${i}`}>{renderInlineFormatting(rawLine)}</div>);
    i++;
  }

  return <div className="space-y-1 font-sans">{elements}</div>;
}
