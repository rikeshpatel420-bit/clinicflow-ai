import { redirect } from "next/navigation";
import { IntegrationShell } from "@/components/integrations/integration-shell";
import { getBackendEnv } from "@/lib/backend/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { InteractiveInvestorManualAdapter } from "@/lib/trading/interactive-investor-manual-adapter";
import { importPortfolioSnapshotCsv, reconcilePortfolioPositions } from "@/lib/trading/portfolio-import";
import { getTradingWebhookHealth } from "@/lib/trading/persistence";
import type { TradingSignal } from "@/lib/trading/types";
import { exampleTradingViewPayload } from "@/lib/trading/webhook";

export const dynamic = "force-dynamic";

const now = new Date();
const sampleSignal: TradingSignal = {
  action: "BUY",
  barTime: new Date(now.getTime() - 30_000).toISOString(),
  eventId: "sample-manual-ticket",
  exchange: "NASDAQ",
  mode: "SIGNAL_ONLY",
  price: 172.24,
  quantity: 1,
  receivedAt: now.toISOString(),
  strategy: "semi_trend_pullback_v1",
  strategyVersion: "1.0.0",
  ticker: "AMD",
  timeframe: "1D",
  triggeredAt: new Date(now.getTime() - 20_000).toISOString(),
};

const manualAdapter = new InteractiveInvestorManualAdapter();
const sampleTicket = manualAdapter.approveForManualPlacement(
  manualAdapter.createProposedOrderTicket(sampleSignal, {
    approvedGbpRiskAmount: 500,
    duplicateOrderExists: false,
    existingTickerExposureGbp: 1_200,
    gbpUsdRate: { rate: 1.28, updatedAt: now.toISOString() },
    highImpactEventWindowActive: false,
    marketSession: "US",
    portfolioValueGbp: 50_000,
    quote: { currency: "USD", price: 172.24, pricedAt: now.toISOString() },
    semiconductorExposureGbp: 14_000,
    signalExpiry: new Date(now.getTime() + 3_600_000).toISOString(),
    signalRationale: "Confirmed bar trend pullback with risk capped before manual placement.",
    stopInvalidationLevel: 163.6,
    target: 189.5,
  }),
);

const samplePortfolioImport = importPortfolioSnapshotCsv(
  "Account,Ticker,ISIN,Exchange,Quantity,Book Cost,Currency\nISA-001,AMD,US0079031078,NASDAQ,3,410.25,USD",
  {
    accountIdentifier: "Account",
    bookCost: "Book Cost",
    currency: "Currency",
    exchange: "Exchange",
    isin: "ISIN",
    quantity: "Quantity",
    ticker: "Ticker",
  },
);

const sampleReconciliation = reconcilePortfolioPositions(
  [{ accountIdentifier: "ISA-001", bookCost: 400, currency: "USD", exchange: "NASDAQ", isin: "US0079031078", quantity: 2, ticker: "AMD" }],
  samplePortfolioImport.rows,
  ["manual-contract-note-required"],
);

function statusBadge(tone: "good" | "warn" | "neutral") {
  if (tone === "good") return "border-[#c8eee6] bg-[#f6fffc] text-[#087968]";
  if (tone === "warn") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-[#dbe6e2] bg-[#fbfdfc] text-[#52615d]";
}

export default async function ConnectionsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  const env = getBackendEnv();
  const health = await getTradingWebhookHealth();
  const webhookUrl = `${env.siteUrl}/webhooks/tradingview`;
  const healthUrl = `${env.siteUrl}/api/trading/webhook-health`;

  return (
    <IntegrationShell
      active="/connections"
      eyebrow="Trading connections"
      title="Semi-swing bot connection centre"
      description="Secure TradingView signal intake, paper-only processing, and Interactive Investor manual placement controls."
    >
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-950 shadow-sm">
        LIVE TRADING DISABLED. Interactive Investor MANUAL EXECUTION ONLY. TradingView signals may generate proposed orders, but you must place each order yourself through Interactive Investor.
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#edf2f0] pb-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#10201d]">TradingView</h2>
              <p className="mt-1 text-sm leading-6 text-[#65736f]">
                Webhook alerts are accepted only with HTTPS, JSON, a high-entropy secret, fresh timestamps, nonce protection, idempotency, and rate limits.
              </p>
            </div>
            <span className={`w-fit rounded-md border px-3 py-1.5 text-xs font-semibold ${statusBadge(env.tradingViewWebhookSecret ? "good" : "warn")}`}>
              Secret {env.tradingViewWebhookSecret ? "configured" : "not configured"}
            </span>
          </div>

          <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
            <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <dt className="font-semibold text-[#10201d]">Webhook endpoint</dt>
              <dd className="mt-2 break-all text-[#52615d]">{webhookUrl}</dd>
            </div>
            <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <dt className="font-semibold text-[#10201d]">Processing mode</dt>
              <dd className="mt-2 text-[#52615d]">{health.currentOperatingMode}</dd>
            </div>
            <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <dt className="font-semibold text-[#10201d]">Latest accepted alert</dt>
              <dd className="mt-2 text-[#52615d]">{health.latestAcceptedWebhookAt ?? "None received"}</dd>
            </div>
            <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <dt className="font-semibold text-[#10201d]">Latest rejected alert</dt>
              <dd className="mt-2 text-[#52615d]">{health.latestRejectedWebhookAt ?? "None rejected"}</dd>
            </div>
            <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <dt className="font-semibold text-[#10201d]">Connection-test status</dt>
              <dd className="mt-2 text-[#52615d]">{health.databaseConnected ? "Database connected" : health.message ?? "Database not connected"}</dd>
            </div>
            <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <dt className="font-semibold text-[#10201d]">Health endpoint</dt>
              <dd className="mt-2 break-all text-[#52615d]">{healthUrl}</dd>
            </div>
          </dl>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <h3 className="text-sm font-semibold text-[#10201d]">Example payload</h3>
              <pre className="mt-3 max-h-80 overflow-auto rounded-md border border-[#dce6e3] bg-white p-3 text-xs leading-5 text-[#394642]">
                {JSON.stringify(exampleTradingViewPayload, null, 2)}
              </pre>
            </section>
            <section className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4 text-sm leading-6 text-[#52615d]">
              <h3 className="text-sm font-semibold text-[#10201d]">Setup instructions</h3>
              <ol className="mt-3 grid list-decimal gap-2 pl-5">
                <li>Generate `TRADINGVIEW_WEBHOOK_SECRET` outside source control.</li>
                <li>Webhook URL: paste the production webhook URL into TradingView.</li>
                <li>Use the supplied Pine strategy and alert JSON from `docs/tradingview`.</li>
                <li>Run in `SIGNAL_ONLY` or `PAPER` mode only.</li>
                <li>Confirm `/api/trading/webhook-health` reports configured and database connected.</li>
              </ol>
              <button type="button" className="mt-4 rounded-md border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d]">
                Connection test
              </button>
            </section>
          </div>
        </article>

        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#edf2f0] pb-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#10201d]">Interactive Investor</h2>
              <p className="mt-1 text-sm leading-6 text-[#65736f]">
                Interactive Investor MANUAL EXECUTION ONLY. TradingView signals may generate proposed orders, but you must place each order yourself through Interactive Investor.
              </p>
            </div>
            <span className={`w-fit rounded-md border px-3 py-1.5 text-xs font-semibold ${statusBadge("neutral")}`}>MANUAL EXECUTION ONLY</span>
          </div>

          <section className="mt-5 rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
            <h3 className="text-sm font-semibold text-[#10201d]">Proposed order queue</h3>
            <div className="mt-3 grid gap-3 text-sm text-[#52615d]">
              <p>{sampleTicket.instrumentName} on {sampleTicket.exchange}</p>
              <p>{sampleTicket.action} {sampleTicket.calculatedQuantity} using II ticker {sampleTicket.interactiveInvestorTicker}</p>
              <p>Latest price {sampleTicket.latestKnownPrice} at {sampleTicket.latestKnownPriceAt}; stale quote: {sampleTicket.quoteStale ? "yes" : "no"}</p>
              <p>Limit {sampleTicket.suggestedLimitPrice}, consideration GBP {sampleTicket.estimatedConsideration}, charges GBP {sampleTicket.estimatedCharges}, risk {sampleTicket.riskPercentage}%</p>
              <p>Stop {sampleTicket.stopInvalidationLevel}, target {sampleTicket.target}, expires {sampleTicket.signalExpiry}</p>
              <textarea readOnly className="min-h-40 rounded-md border border-[#dce6e3] bg-white p-3 text-xs leading-5 text-[#394642]" value={sampleTicket.copyableOrderSummary} />
              <button type="button" className="w-fit rounded-md border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d]">
                Approve manual placement
              </button>
              <p className="font-semibold text-amber-800">Status: {sampleTicket.status}</p>
            </div>
          </section>

          <section className="mt-5 rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
            <h3 className="text-sm font-semibold text-[#10201d]">Portfolio import controls</h3>
            <div className="mt-3 grid gap-3 text-sm text-[#52615d] md:grid-cols-2">
              <button type="button" className="rounded-md border border-[#cdd8d5] bg-white px-4 py-2.5 font-semibold text-[#10201d]">Import portfolio CSV</button>
              <button type="button" className="rounded-md border border-[#cdd8d5] bg-white px-4 py-2.5 font-semibold text-[#10201d]">Import transactions CSV</button>
              <button type="button" className="rounded-md border border-[#cdd8d5] bg-white px-4 py-2.5 font-semibold text-[#10201d]">Enter contract note</button>
              <button type="button" className="rounded-md border border-[#cdd8d5] bg-white px-4 py-2.5 font-semibold text-[#10201d]">Enter opening position</button>
            </div>
          </section>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Webhook processing state</h2>
          <div className="mt-4 grid gap-3 text-sm text-[#52615d]">
            <p>Database connected: {health.databaseConnected ? "yes" : "no"}</p>
            <p>Latest accepted webhook: {health.latestAcceptedWebhookAt ?? "none"}</p>
            <p>Latest rejected webhook: {health.latestRejectedWebhookAt ?? "none"}</p>
            <p>Live execution: disabled</p>
          </div>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Reconciliation status</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-[#65736f]">
                <tr>
                  <th className="px-3 py-2">Ticker</th>
                  <th className="px-3 py-2">Bot</th>
                  <th className="px-3 py-2">Imported II</th>
                  <th className="px-3 py-2">Difference</th>
                  <th className="px-3 py-2">Unresolved</th>
                </tr>
              </thead>
              <tbody>
                {sampleReconciliation.map((row) => (
                  <tr key={row.ticker} className="border-t border-[#edf2f0]">
                    <td className="px-3 py-3 font-semibold text-[#10201d]">{row.ticker}</td>
                    <td className="px-3 py-3 text-[#52615d]">{row.botQuantity}</td>
                    <td className="px-3 py-3 text-[#52615d]">{row.importedQuantity}</td>
                    <td className="px-3 py-3 text-[#52615d]">{row.quantityDifference}</td>
                    <td className="px-3 py-3 text-[#52615d]">{row.unresolvedTransactions.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="mt-4 rounded-md border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d]">
            Approve reconciliation changes
          </button>
        </article>
      </section>
    </IntegrationShell>
  );
}
