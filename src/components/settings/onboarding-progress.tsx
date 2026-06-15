import type { OnboardingStep } from "@/lib/settings/data";

export function OnboardingProgress({ steps }: { steps: OnboardingStep[] }) {
  return (
    <div className="grid gap-3">
      {steps.map((step) => (
        <div key={step.id} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[#10201d]">{step.label}</p>
              <p className="mt-1 text-sm leading-6 text-[#65736f]">{step.description}</p>
            </div>
            <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-[#087968] ring-1 ring-[#dce6e3]">
              {step.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

