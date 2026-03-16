import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  fetchBitcoinVitals,
  fetchMacroSignals,
  fetchEtfFlows,
  fetchNetworkHealth,
  fetchFearGreed,
  fetchCorrelationData,
} from "@/lib/monitor-data";

export const revalidate = 300;

export async function GET(req: Request) {
  const limited = rateLimit(`monitor:${getClientIp(req)}`, {
    maxRequests: 20,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    switch (type) {
      case "vitals": {
        const data = await fetchBitcoinVitals();
        return NextResponse.json(data);
      }
      case "macro": {
        const data = await fetchMacroSignals();
        return NextResponse.json(data);
      }
      case "etf-flows": {
        const data = await fetchEtfFlows();
        return NextResponse.json(data);
      }
      case "network": {
        const data = await fetchNetworkHealth();
        return NextResponse.json(data);
      }
      case "fear-greed": {
        const data = await fetchFearGreed();
        return NextResponse.json(data);
      }
      case "correlation": {
        const data = await fetchCorrelationData();
        return NextResponse.json(data);
      }
      case "all": {
        const [vitals, macro, etfFlows, network, fearGreed, correlation] =
          await Promise.allSettled([
            fetchBitcoinVitals(),
            fetchMacroSignals(),
            fetchEtfFlows(),
            fetchNetworkHealth(),
            fetchFearGreed(),
            fetchCorrelationData(),
          ]);
        return NextResponse.json({
          vitals: vitals.status === "fulfilled" ? vitals.value : null,
          macro: macro.status === "fulfilled" ? macro.value : null,
          etfFlows: etfFlows.status === "fulfilled" ? etfFlows.value : null,
          network: network.status === "fulfilled" ? network.value : null,
          fearGreed: fearGreed.status === "fulfilled" ? fearGreed.value : null,
          correlation: correlation.status === "fulfilled" ? correlation.value : [],
        });
      }
      default:
        return NextResponse.json(
          { error: "Invalid type. Use: vitals, macro, etf-flows, network, fear-greed, correlation, all" },
          { status: 400 }
        );
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
