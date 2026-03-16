// Bitcoin Monitor Dashboard types

export interface HalvingCountdown {
  blocksRemaining: number;
  estimatedDate: string;
  currentReward: number;
}

export interface BitcoinVitals {
  price: number;
  change24h: number;
  satsPerDollar: number;
  blockHeight: number;
  mempoolTxCount: number;
  halvingCountdown: HalvingCountdown;
  lastUpdated: string;
}

export interface MacroSignalEntry {
  status: string;
  value?: number;
  sparkline?: number[];
  btcReturn5?: number;
  qqqReturn5?: number;
  qqqRoc20?: number;
  xlpRoc20?: number;
  btcPrice?: number;
  sma50?: number;
  sma200?: number;
  vwap30d?: number;
  mayerMultiple?: number;
  change30d?: number;
  history?: Array<{ value: number; date: string }>;
}

export interface MacroSignalsData {
  timestamp: string;
  verdict: "BUY" | "CASH" | "UNKNOWN";
  bullishCount: number;
  totalCount: number;
  signals: {
    liquidity: MacroSignalEntry;
    flowStructure: MacroSignalEntry;
    macroRegime: MacroSignalEntry;
    technicalTrend: MacroSignalEntry;
    hashRate: MacroSignalEntry;
    priceMomentum: MacroSignalEntry;
    fearGreed: MacroSignalEntry;
  };
  meta: { qqqSparkline: number[] };
  unavailable: boolean;
}

export interface EtfFlowEntry {
  ticker: string;
  issuer: string;
  price: number;
  priceChange: number;
  volume: number;
  avgVolume: number;
  volumeRatio: number;
  direction: "inflow" | "outflow" | "neutral";
  estFlow: number;
}

export interface EtfFlowsData {
  timestamp: string;
  summary: {
    etfCount: number;
    totalVolume: number;
    totalEstFlow: number;
    netDirection: string;
    inflowCount: number;
    outflowCount: number;
  };
  etfs: EtfFlowEntry[];
}

export interface NetworkHealthData {
  hashRate: { current: number; change30d: number; sparkline: number[] };
  difficulty: { current: number; nextAdjustment: number; estimatedDate: string };
  lightning: { capacityBtc: number; channels: number; nodes: number };
  lastUpdated: string;
}

export interface FearGreedData {
  value: number;
  label: string;
  history: Array<{ value: number; date: string }>;
  lastUpdated: string;
}

export interface CorrelationPoint {
  date: string;
  btcPrice?: number;
  m2Supply?: number;
  cpiRate?: number;
}
