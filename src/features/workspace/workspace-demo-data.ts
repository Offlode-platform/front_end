import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { cache } from "react";
import type { WorkspaceDemoClient } from "./types";

function extractClientsArraySource(html: string): string {
  const marker = "var clients = [";
  const start = html.indexOf(marker);
  if (start === -1) {
    throw new Error("Unable to locate workspace demo clients array in HTML.");
  }

  const arrayStart = html.indexOf("[", start);
  let cursor = arrayStart;
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escaped = false;

  while (cursor < html.length) {
    const ch = html[cursor];

    if (escaped) {
      escaped = false;
      cursor += 1;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      cursor += 1;
      continue;
    }

    if (!inDouble && !inTemplate && ch === "'") {
      inSingle = !inSingle;
      cursor += 1;
      continue;
    }

    if (!inSingle && !inTemplate && ch === '"') {
      inDouble = !inDouble;
      cursor += 1;
      continue;
    }

    if (!inSingle && !inDouble && ch === "`") {
      inTemplate = !inTemplate;
      cursor += 1;
      continue;
    }

    if (inSingle || inDouble || inTemplate) {
      cursor += 1;
      continue;
    }

    if (ch === "[") depth += 1;
    if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        return html.slice(arrayStart, cursor + 1);
      }
    }

    cursor += 1;
  }

  throw new Error("Unable to extract complete clients array source.");
}

function parseClientsFromHtml(html: string): WorkspaceDemoClient[] {
  const arraySource = extractClientsArraySource(html);
  const sandbox: { clients?: WorkspaceDemoClient[] } = {};
  vm.runInNewContext(`clients = ${arraySource};`, sandbox, { timeout: 5000 });
  return Array.isArray(sandbox.clients) ? sandbox.clients : [];
}

export const getWorkspaceDemoClients = cache(async (): Promise<WorkspaceDemoClient[]> => {
  const htmlPath = path.join(process.cwd(), "offlode-v5-unified-111.html");
  const html = await readFile(htmlPath, "utf8");
  return parseClientsFromHtml(html);
});
