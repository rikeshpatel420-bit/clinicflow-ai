const required = ["TRADINGVIEW_WEBHOOK_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "APP_BASE_URL"];
const missing = required.filter((name) => !process.env[name]);

if (process.env.LIVE_TRADING_ENABLED && process.env.LIVE_TRADING_ENABLED !== "false") {
  console.error("LIVE_TRADING_ENABLED must remain false.");
  process.exit(1);
}

if (process.env.TRADINGVIEW_WEBHOOK_SECRET && process.env.TRADINGVIEW_WEBHOOK_SECRET.length < 32) {
  console.error("TRADINGVIEW_WEBHOOK_SECRET must be at least 32 characters.");
  process.exit(1);
}

if (missing.length) {
  console.error(`Missing required production environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

if (process.env.SIGNAL_MODE && !["SIGNAL_ONLY", "PAPER"].includes(process.env.SIGNAL_MODE)) {
  console.error("SIGNAL_MODE must be SIGNAL_ONLY or PAPER.");
  process.exit(1);
}
