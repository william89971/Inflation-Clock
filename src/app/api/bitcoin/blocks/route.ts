import { NextResponse } from "next/server";

interface MempoolBlock {
  id: string;
  height: number;
  timestamp: number;
  tx_count: number;
  previousblockhash: string;
}

export interface BlockData {
  num: number;
  hash: string;
  prev: string;
  txns: number | null;
  time: string;
}

const FALLBACK: BlockData[] = [
  { num: 940_021, hash: "0000000000000000000392a...", prev: "000000000000000000041f3...", txns: 2_841, time: "10m ago" },
  { num: 940_022, hash: "00000000000000000001d7c...", prev: "0000000000000000000392a...", txns: 3_102, time: "8m ago"  },
  { num: 940_023, hash: "000000000000000000028b1...", prev: "00000000000000000001d7c...", txns: 2_677, time: "6m ago"  },
  { num: 940_024, hash: "???",                        prev: "000000000000000000028b1...", txns: null,  time: "Mining…" },
];

function relativeTime(timestamp: number): string {
  const diff = Math.floor(Date.now() / 1000) - timestamp;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function trunc(hash: string): string {
  return hash.slice(0, 16) + "...";
}

export async function GET() {
  try {
    const res = await fetch("https://mempool.space/api/v1/blocks", {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return NextResponse.json(FALLBACK);

    const blocks: MempoolBlock[] = await res.json();
    if (!blocks?.length) return NextResponse.json(FALLBACK);

    // 3 most recent confirmed blocks, oldest first (left→right on screen)
    const confirmed = blocks.slice(0, 3).reverse();
    const latest = blocks[0];

    const result: BlockData[] = [
      ...confirmed.map((b) => ({
        num: b.height,
        hash: trunc(b.id),
        prev: trunc(b.previousblockhash),
        txns: b.tx_count,
        time: relativeTime(b.timestamp),
      })),
      {
        num: latest.height + 1,
        hash: "???",
        prev: trunc(latest.id),
        txns: null,
        time: "Mining…",
      },
    ];

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
