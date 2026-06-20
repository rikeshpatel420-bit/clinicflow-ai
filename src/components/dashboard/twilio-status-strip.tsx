import type { TwilioSetupHealth } from "@/lib/twilio/health";

function toneClass(value: boolean) {
  return value ? "border-[#c8efe5] bg-[#f2fbf8] text-[#087968]" : "border-[#e7ecea] bg-[#fbfcfc] text-[#65736f]";
}

export function TwilioStatusStrip({ health }: { health: TwilioSetupHealth }) {
  const items = [
    { label: "Twilio Connected", value: health.indicators.connected },
    { label: "Phone Number Active", value: health.indicators.phoneNumberActive },
    { label: "SMS Working", value: health.indicators.smsWorking },
    { label: "Voice Working", value: health.indicators.voiceWorking },
  ];

  return (
    <section aria-label="Twilio readiness" className="grid gap-3 px-4 pt-4 sm:px-6 xl:grid-cols-4">
      {items.map((item) => (
        <article key={item.label} className={`rounded-lg border p-4 shadow-sm ${toneClass(item.value)}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]">{item.label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight">{item.value ? "Ready" : "Missing"}</p>
        </article>
      ))}
    </section>
  );
}
