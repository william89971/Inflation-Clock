import type {
  BitcoinVitals,
  MacroSignalsData,
  MacroSignalEntry,
  EtfFlowsData,
  EtfFlowEntry,
  NetworkHealthData,
  FearGreedData,
  CorrelationPoint,
} from "@/types/monitor";
import { BTC_PRICES_FALLBACK } from "@/lib/bitcoin";
import { BTC_SPOT_ETFS } from "@/data/btc-etfs";

// --- Helpers ---

const HALVING_INTERVAL = 210_000;
const KNOWN_HALVINGS = [0, 210_000, 420_000, 630_000, 840_000];

function computeHalvingCountdown(blockHeight: number) {
  const nextHalving =
    KNOWN_HALVINGS.find((h) => h > blockHeight) ??
    Math.ceil(blockHeight / HALVING_INTERVAL) * HALVING_INTERVAL;
  const blocksRemaining = nextHalving - blockHeight;
  const minutesRemaining = blocksRemaining * 10;
  const estimatedDate = new Date(
    Date.now() + minutesRemaining * 60_000
  ).toISOString();
  const epoch = KNOWN_HALVINGS.filter((h) => h <= blockHeight).length;
  const currentReward = 50 / Math.pow(2, epoch);
  return { blocksRemaining, estimatedDate, currentReward };
}

function rateOfChange(prices: number[], days: number): number | null {
  if (prices.length < days + 1) return null;
  const current = prices[prices.length - 1];
  const past = prices[prices.length - 1 - days];
  return past !== 0 ? ((current - past) / past) * 100 : null;
}

function sma(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((s, v) => s + v, 0) / period;
}

function extractClosePrices(chart: Record<string, unknown>): number[] {
  const result = (chart?.chart as Record<string, unknown[]>)?.result?.[0] as
    | Record<string, unknown>
    | undefined;
  const closes = (
    result?.indicators as Record<string, Record<string, number[]>[]>
  )?.quote?.[0]?.close;
  return Array.isArray(closes) ? closes.filter((v): v is number => v != null) : [];
}

interface PriceVolume {
  price: number;
  volume: number;
}

function extractAlignedPriceVolume(
  chart: Record<string, unknown>
): PriceVolume[] {
  const result = (chart?.chart as Record<string, unknown[]>)?.result?.[0] as
    | Record<string, unknown>
    | undefined;
  const quote = (
    result?.indicators as Record<string, Record<string, number[]>[]>
  )?.quote?.[0];
  const closes = quote?.close || [];
  const volumes = quote?.volume || [];
  const aligned: PriceVolume[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (closes[i] != null && volumes[i] != null)
      aligned.push({ price: closes[i], volume: volumes[i] });
  }
  return aligned;
}

async function fetchYahooChart(symbol: string, range = "1y", interval = "1d") {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 900 },
  });
  if (!res.ok) return null;
  return res.json();
}


// --- Bitcoin Vitals ---

export async function fetchBitcoinVitals(): Promise<BitcoinVitals> {
  try {
    const [priceRes, blockRes, mempoolRes] = await Promise.allSettled([
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
        { next: { revalidate: 300 } }
      ),
      fetch("https://mempool.space/api/blocks/tip/height", {
        next: { revalidate: 300 },
      }),
      fetch("https://mempool.space/api/mempool", {
        next: { revalidate: 300 },
      }),
    ]);

    let price = BTC_PRICES_FALLBACK[new Date().getFullYear()] ?? 85000;
    let change24h = 0;
    if (priceRes.status === "fulfilled" && priceRes.value.ok) {
      const data = await priceRes.value.json();
      price = data.bitcoin?.usd ?? price;
      change24h = data.bitcoin?.usd_24h_change ?? 0;
    }

    let blockHeight = 0;
    if (blockRes.status === "fulfilled" && blockRes.value.ok) {
      blockHeight = parseInt(await blockRes.value.text(), 10) || 0;
    }

    let mempoolTxCount = 0;
    if (mempoolRes.status === "fulfilled" && mempoolRes.value.ok) {
      const mp = await mempoolRes.value.json();
      mempoolTxCount = mp.count ?? 0;
    }

    const satsPerDollar = price > 0 ? Math.round(100_000_000 / price) : 0;
    const halvingCountdown = computeHalvingCountdown(blockHeight);

    return {
      price,
      change24h: +change24h.toFixed(2),
      satsPerDollar,
      blockHeight,
      mempoolTxCount,
      halvingCountdown,
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    const price = BTC_PRICES_FALLBACK[new Date().getFullYear()] ?? 85000;
    return {
      price,
      change24h: 0,
      satsPerDollar: Math.round(100_000_000 / price),
      blockHeight: 0,
      mempoolTxCount: 0,
      halvingCountdown: {
        blocksRemaining: 0,
        estimatedDate: "",
        currentReward: 3.125,
      },
      lastUpdated: new Date().toISOString(),
    };
  }
}

// --- Macro Signals ---

export async function fetchMacroSignals(): Promise<MacroSignalsData> {
  const fallback: MacroSignalsData = {
    timestamp: new Date().toISOString(),
    verdict: "UNKNOWN",
    bullishCount: 0,
    totalCount: 0,
    signals: {
      liquidity: { status: "UNKNOWN" },
      flowStructure: { status: "UNKNOWN" },
      macroRegime: { status: "UNKNOWN" },
      technicalTrend: { status: "UNKNOWN" },
      hashRate: { status: "UNKNOWN" },
      priceMomentum: { status: "UNKNOWN" },
      fearGreed: { status: "UNKNOWN" },
    },
    meta: { qqqSparkline: [] },
    unavailable: true,
  };

  try {
    // Fetch Yahoo data in parallel (ISR cache prevents rate limiting)
    const [jpyChart, btcChart, qqqChart, xlpChart] = await Promise.all([
      fetchYahooChart("JPY=X"),
      fetchYahooChart("BTC-USD"),
      fetchYahooChart("QQQ"),
      fetchYahooChart("XLP"),
    ]);

    const jpyPrices = jpyChart ? extractClosePrices(jpyChart) : [];
    const btcPrices = btcChart ? extractClosePrices(btcChart) : [];
    const btcAligned = btcChart ? extractAlignedPriceVolume(btcChart) : [];
    const qqqPrices = qqqChart ? extractClosePrices(qqqChart) : [];
    const xlpPrices = xlpChart ? extractClosePrices(xlpChart) : [];

    // 1. Liquidity Signal: JPY 30d ROC
    const jpyRoc30 = rateOfChange(jpyPrices, 30);
    const liquidityStatus =
      jpyRoc30 !== null && jpyRoc30 < -2 ? "SQUEEZE" : "NORMAL";

    // 2. Flow Structure: BTC vs QQQ 5d return
    const btcReturn5 = rateOfChange(btcPrices, 5);
    const qqqReturn5 = rateOfChange(qqqPrices, 5);
    const flowStatus =
      btcReturn5 !== null &&
      qqqReturn5 !== null &&
      Math.abs(btcReturn5 - qqqReturn5) > 5
        ? "PASSIVE GAP"
        : "ALIGNED";

    // 3. Macro Regime: QQQ vs XLP 20d ROC
    const qqqRoc20 = rateOfChange(qqqPrices, 20);
    const xlpRoc20 = rateOfChange(xlpPrices, 20);
    const regimeStatus =
      qqqRoc20 !== null && xlpRoc20 !== null && qqqRoc20 > xlpRoc20
        ? "RISK-ON"
        : "DEFENSIVE";

    // 4. Technical Trend: SMA50, SMA200, VWAP, Mayer Multiple
    const btcPrice =
      btcPrices.length > 0 ? btcPrices[btcPrices.length - 1] : null;
    const sma50 = sma(btcPrices, 50);
    const sma200 = sma(btcPrices, 200);
    let btcVwap: number | null = null;
    if (btcAligned.length >= 30) {
      const last30 = btcAligned.slice(-30);
      let sumPV = 0,
        sumV = 0;
      for (const { price, volume } of last30) {
        sumPV += price * volume;
        sumV += volume;
      }
      if (sumV > 0) btcVwap = +(sumPV / sumV).toFixed(0);
    }
    const mayerMultiple =
      btcPrice && sma200 ? +(btcPrice / sma200).toFixed(2) : null;

    let trendStatus = "NEUTRAL";
    if (btcPrice && sma50) {
      const aboveSma = btcPrice > sma50 * 1.02;
      const belowSma = btcPrice < sma50 * 0.98;
      const aboveVwap = btcVwap === null || btcPrice > btcVwap;
      const belowVwap = btcVwap !== null && btcPrice < btcVwap;
      if (aboveSma && aboveVwap) trendStatus = "BULLISH";
      else if (belowSma && belowVwap) trendStatus = "BEARISH";
    }

    // 5. Hash Rate
    let hashStatus = "UNKNOWN";
    let hashChange30d: number | null = null;
    try {
      const hashRes = await fetch(
        "https://mempool.space/api/v1/mining/hashrate/1m",
        { next: { revalidate: 900 } }
      );
      if (hashRes.ok) {
        const hashData = await hashRes.json();
        const rates = hashData?.hashrates;
        if (Array.isArray(rates) && rates.length >= 2) {
          const latest = rates[rates.length - 1]?.avgHashrate;
          const past = rates[0]?.avgHashrate;
          if (latest && past) {
            hashChange30d = +((latest - past) / past * 100).toFixed(1);
            hashStatus =
              hashChange30d > 3
                ? "GROWING"
                : hashChange30d < -3
                  ? "DECLINING"
                  : "STABLE";
          }
        }
      }
    } catch {
      /* fallback */
    }

    // 6. Price Momentum: Mayer Multiple
    const momentumStatus =
      mayerMultiple !== null
        ? mayerMultiple > 1.0
          ? "STRONG"
          : mayerMultiple > 0.8
            ? "MODERATE"
            : "WEAK"
        : "UNKNOWN";

    // 7. Fear & Greed
    let fgValue: number | null = null;
    let fgLabel = "UNKNOWN";
    let fgHistory: Array<{ value: number; date: string }> = [];
    try {
      const fgRes = await fetch(
        "https://api.alternative.me/fng/?limit=30&format=json",
        { next: { revalidate: 1800 } }
      );
      if (fgRes.ok) {
        const fgData = await fgRes.json();
        if (fgData?.data?.length > 0) {
          fgValue = parseInt(fgData.data[0].value, 10);
          fgLabel = fgData.data[0].value_classification?.toUpperCase() || "UNKNOWN";
          fgHistory = fgData.data
            .map((d: { value: string; timestamp: string }) => ({
              value: parseInt(d.value, 10),
              date: new Date(parseInt(d.timestamp, 10) * 1000)
                .toISOString()
                .slice(0, 10),
            }))
            .reverse();
        }
      }
    } catch {
      /* fallback */
    }

    // Build signal list and compute verdict
    const signalList = [
      {
        name: "Liquidity",
        status: liquidityStatus,
        bullish: liquidityStatus === "NORMAL",
      },
      {
        name: "Flow Structure",
        status: flowStatus,
        bullish: flowStatus === "ALIGNED",
      },
      {
        name: "Macro Regime",
        status: regimeStatus,
        bullish: regimeStatus === "RISK-ON",
      },
      {
        name: "Technical Trend",
        status: trendStatus,
        bullish: trendStatus === "BULLISH",
      },
      {
        name: "Hash Rate",
        status: hashStatus,
        bullish: hashStatus === "GROWING",
      },
      {
        name: "Price Momentum",
        status: momentumStatus,
        bullish: momentumStatus === "STRONG",
      },
      {
        name: "Fear & Greed",
        status: fgLabel,
        bullish: fgValue !== null && fgValue > 50,
      },
    ];

    let bullishCount = 0,
      totalCount = 0;
    for (const s of signalList) {
      if (s.status !== "UNKNOWN") {
        totalCount++;
        if (s.bullish) bullishCount++;
      }
    }
    const verdict: MacroSignalsData["verdict"] =
      totalCount === 0
        ? "UNKNOWN"
        : bullishCount / totalCount >= 0.57
          ? "BUY"
          : "CASH";

    return {
      timestamp: new Date().toISOString(),
      verdict,
      bullishCount,
      totalCount,
      signals: {
        liquidity: {
          status: liquidityStatus,
          value: jpyRoc30 !== null ? +jpyRoc30.toFixed(2) : undefined,
          sparkline: jpyPrices.slice(-30),
        },
        flowStructure: {
          status: flowStatus,
          btcReturn5: btcReturn5 !== null ? +btcReturn5.toFixed(2) : undefined,
          qqqReturn5: qqqReturn5 !== null ? +qqqReturn5.toFixed(2) : undefined,
        },
        macroRegime: {
          status: regimeStatus,
          qqqRoc20: qqqRoc20 !== null ? +qqqRoc20.toFixed(2) : undefined,
          xlpRoc20: xlpRoc20 !== null ? +xlpRoc20.toFixed(2) : undefined,
        },
        technicalTrend: {
          status: trendStatus,
          btcPrice: btcPrice ?? undefined,
          sma50: sma50 !== null ? +sma50.toFixed(0) : undefined,
          sma200: sma200 !== null ? +sma200.toFixed(0) : undefined,
          vwap30d: btcVwap ?? undefined,
          mayerMultiple: mayerMultiple ?? undefined,
          sparkline: btcPrices.slice(-30),
        },
        hashRate: {
          status: hashStatus,
          change30d: hashChange30d ?? undefined,
        },
        priceMomentum: { status: momentumStatus },
        fearGreed: {
          status: fgLabel,
          value: fgValue ?? undefined,
          history: fgHistory,
        },
      },
      meta: { qqqSparkline: qqqPrices.slice(-30) },
      unavailable: false,
    };
  } catch {
    return fallback;
  }
}

// --- ETF Flows ---

function parseEtfChartData(
  chart: Record<string, unknown>,
  ticker: string,
  issuer: string
): EtfFlowEntry | null {
  const result = (chart?.chart as Record<string, unknown[]>)?.result?.[0] as
    | Record<string, unknown>
    | undefined;
  if (!result) return null;

  const quote = (
    result.indicators as Record<string, Record<string, number[]>[]>
  )?.quote?.[0];
  const closes = (quote?.close || []).filter(
    (p): p is number => p != null
  );
  const volumes = (quote?.volume || []).filter(
    (v): v is number => v != null
  );

  if (closes.length < 2) return null;

  const latestPrice = closes[closes.length - 1];
  const prevPrice = closes[closes.length - 2];
  const priceChange =
    prevPrice ? ((latestPrice - prevPrice) / prevPrice) * 100 : 0;

  const latestVolume = volumes.length > 0 ? volumes[volumes.length - 1] : 0;
  const avgVolume =
    volumes.length > 1
      ? volumes.slice(0, -1).reduce((a, b) => a + b, 0) /
        (volumes.length - 1)
      : latestVolume;

  const volumeRatio = avgVolume > 0 ? latestVolume / avgVolume : 1;
  const direction: EtfFlowEntry["direction"] =
    priceChange > 0.1 ? "inflow" : priceChange < -0.1 ? "outflow" : "neutral";
  const estFlow =
    Math.round(latestVolume * latestPrice * (priceChange > 0 ? 1 : -1) * 0.1);

  return {
    ticker,
    issuer,
    price: +latestPrice.toFixed(2),
    priceChange: +priceChange.toFixed(2),
    volume: latestVolume,
    avgVolume: Math.round(avgVolume),
    volumeRatio: +volumeRatio.toFixed(2),
    direction,
    estFlow,
  };
}

export async function fetchEtfFlows(): Promise<EtfFlowsData> {
  const fallback: EtfFlowsData = {
    timestamp: new Date().toISOString(),
    summary: {
      etfCount: 0,
      totalVolume: 0,
      totalEstFlow: 0,
      netDirection: "UNKNOWN",
      inflowCount: 0,
      outflowCount: 0,
    },
    etfs: [],
  };

  try {
    // Fetch all ETFs in parallel (ISR cache prevents rate limiting)
    const results = await Promise.allSettled(
      BTC_SPOT_ETFS.map(({ ticker, issuer }) =>
        fetchYahooChart(ticker, "5d", "1d").then((chart) =>
          chart ? parseEtfChartData(chart, ticker, issuer) : null
        )
      )
    );
    const etfs: EtfFlowEntry[] = results
      .filter(
        (r): r is PromiseFulfilledResult<EtfFlowEntry | null> =>
          r.status === "fulfilled" && r.value !== null
      )
      .map((r) => r.value!);

    if (etfs.length === 0) return fallback;

    etfs.sort((a, b) => b.volume - a.volume);
    const totalVolume = etfs.reduce((sum, e) => sum + e.volume, 0);
    const totalEstFlow = etfs.reduce((sum, e) => sum + e.estFlow, 0);
    const inflowCount = etfs.filter((e) => e.direction === "inflow").length;
    const outflowCount = etfs.filter((e) => e.direction === "outflow").length;
    const netDirection =
      totalEstFlow > 0
        ? "NET INFLOW"
        : totalEstFlow < 0
          ? "NET OUTFLOW"
          : "NEUTRAL";

    return {
      timestamp: new Date().toISOString(),
      summary: {
        etfCount: etfs.length,
        totalVolume,
        totalEstFlow,
        netDirection,
        inflowCount,
        outflowCount,
      },
      etfs,
    };
  } catch {
    return fallback;
  }
}

// --- Network Health ---

export async function fetchNetworkHealth(): Promise<NetworkHealthData> {
  const fallback: NetworkHealthData = {
    hashRate: { current: 0, change30d: 0, sparkline: [] },
    difficulty: { current: 0, nextAdjustment: 0, estimatedDate: "" },
    lightning: { capacityBtc: 0, channels: 0, nodes: 0 },
    lastUpdated: new Date().toISOString(),
  };

  try {
    const [hashRes, diffRes, lnRes] = await Promise.allSettled([
      fetch("https://mempool.space/api/v1/mining/hashrate/1m", {
        next: { revalidate: 900 },
      }),
      fetch("https://mempool.space/api/v1/difficulty-adjustment", {
        next: { revalidate: 900 },
      }),
      fetch("https://mempool.space/api/v1/lightning/statistics/latest", {
        next: { revalidate: 3600 },
      }),
    ]);

    let hashRate = fallback.hashRate;
    if (hashRes.status === "fulfilled" && hashRes.value.ok) {
      const data = await hashRes.value.json();
      const rates = data?.hashrates;
      if (Array.isArray(rates) && rates.length >= 2) {
        const current = rates[rates.length - 1]?.avgHashrate ?? 0;
        const past = rates[0]?.avgHashrate ?? 0;
        const change30d = past ? +((current - past) / past * 100).toFixed(1) : 0;
        const sparkline = rates
          .slice(-30)
          .map((r: { avgHashrate: number }) => r.avgHashrate / 1e18);
        hashRate = { current: current / 1e18, change30d, sparkline };
      }
    }

    let difficulty = fallback.difficulty;
    if (diffRes.status === "fulfilled" && diffRes.value.ok) {
      const data = await diffRes.value.json();
      difficulty = {
        current: data?.difficultyChange ?? 0,
        nextAdjustment: data?.progressPercent ?? 0,
        estimatedDate: data?.estimatedRetargetDate
          ? new Date(data.estimatedRetargetDate * 1000).toISOString()
          : "",
      };
    }

    let lightning = fallback.lightning;
    if (lnRes.status === "fulfilled" && lnRes.value.ok) {
      const data = await lnRes.value.json();
      const latest = data?.latest ?? data;
      lightning = {
        capacityBtc: (latest?.total_capacity ?? 0) / 1e8,
        channels: latest?.channel_count ?? 0,
        nodes: latest?.node_count ?? 0,
      };
    }

    return {
      hashRate,
      difficulty,
      lightning,
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return fallback;
  }
}

// --- Fear & Greed ---

export async function fetchFearGreed(): Promise<FearGreedData> {
  try {
    const res = await fetch(
      "https://api.alternative.me/fng/?limit=30&format=json",
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) throw new Error("F&G API error");
    const data = await res.json();
    if (!data?.data?.length)
      return {
        value: 50,
        label: "Neutral",
        history: [],
        lastUpdated: new Date().toISOString(),
      };

    const latest = data.data[0];
    const value = parseInt(latest.value, 10);
    const label = latest.value_classification || "Neutral";
    const history = data.data
      .map((d: { value: string; timestamp: string }) => ({
        value: parseInt(d.value, 10),
        date: new Date(parseInt(d.timestamp, 10) * 1000)
          .toISOString()
          .slice(0, 10),
      }))
      .reverse();

    return { value, label, history, lastUpdated: new Date().toISOString() };
  } catch {
    return {
      value: 50,
      label: "Neutral",
      history: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

// --- Correlation Data ---

export async function fetchCorrelationData(): Promise<CorrelationPoint[]> {
  try {
    const [btcRes, m2Res] = await Promise.allSettled([
      fetch(
        "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=3650&interval=daily",
        { next: { revalidate: 21600 } }
      ),
      fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=M2SL&api_key=${process.env.FRED_API_KEY || "DEMO_KEY"}&file_type=json&observation_start=2015-01-01&frequency=m`,
        { next: { revalidate: 86400 } }
      ),
    ]);

    const btcByMonth: Record<string, number[]> = {};
    if (btcRes.status === "fulfilled" && btcRes.value.ok) {
      const data = await btcRes.value.json();
      for (const [ts, price] of data.prices || []) {
        const d = new Date(ts);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!btcByMonth[key]) btcByMonth[key] = [];
        btcByMonth[key].push(price);
      }
    }

    const m2ByMonth: Record<string, number> = {};
    if (m2Res.status === "fulfilled" && m2Res.value.ok) {
      const data = await m2Res.value.json();
      for (const obs of data.observations || []) {
        if (obs.value !== ".") {
          const key = obs.date.slice(0, 7);
          m2ByMonth[key] = parseFloat(obs.value);
        }
      }
    }

    const allMonths = new Set([
      ...Object.keys(btcByMonth),
      ...Object.keys(m2ByMonth),
    ]);
    const sorted = [...allMonths].sort();

    return sorted.map((month) => {
      const btcPrices = btcByMonth[month];
      const btcAvg =
        btcPrices && btcPrices.length > 0
          ? btcPrices.reduce((a, b) => a + b, 0) / btcPrices.length
          : undefined;
      return {
        date: month,
        btcPrice: btcAvg ? +btcAvg.toFixed(0) : undefined,
        m2Supply: m2ByMonth[month],
      };
    });
  } catch {
    return [];
  }
}

