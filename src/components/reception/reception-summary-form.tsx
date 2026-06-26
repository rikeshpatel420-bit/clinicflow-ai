import { saveReceptionSummaryAction } from "@/app/ai/actions";
import type { ReceptionSummaryDraft } from "@/lib/reception/data";

export function ReceptionSummaryForm({ draft }: { draft: ReceptionSummaryDraft }) {
  return (
    <form action={saveReceptionSummaryAction} className="grid gap-5 rounded-[30px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#087968]">Editable AI summary</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">Save the receptionist draft before it leaves the console.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#65736f]">
            Each field is editable so reception can tune the tone, urgency, and follow-up before the summary is saved into the audit trail.
          </p>
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-[#087968] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(8,121,104,0.22)] transition hover:bg-[#066657]"
        >
          Save summary
        </button>
      </div>

      <input type="hidden" name="call_id" value={draft.callId ?? ""} />
      <input type="hidden" name="lead_id" value={draft.leadId ?? ""} />

      <div className="grid gap-4 xl:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[#394642]">
          Patient summary
          <textarea
            name="patient_summary"
            defaultValue={draft.patientSummary}
            rows={5}
            className="rounded-[22px] border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 leading-7 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#394642]">
          Reason for calling
          <textarea
            name="reason_for_calling"
            defaultValue={draft.reasonForCalling}
            rows={5}
            className="rounded-[22px] border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 leading-7 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
          />
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[#394642]">
          Clinical notes
          <textarea
            name="clinical_notes"
            defaultValue={draft.clinicalNotes}
            rows={4}
            className="rounded-[22px] border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 leading-7 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#394642]">
          Reception notes
          <textarea
            name="reception_notes"
            defaultValue={draft.receptionNotes}
            rows={4}
            className="rounded-[22px] border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 leading-7 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2 text-sm font-medium text-[#394642]">
          Urgency score
          <input
            name="urgency_score"
            type="number"
            min={0}
            max={100}
            defaultValue={draft.urgencyScore}
            className="rounded-full border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#394642]">
          Appointment recommendation
          <input
            name="appointment_recommendation"
            defaultValue={draft.appointmentRecommendation}
            className="rounded-full border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#394642]">
          Treatment recommendation
          <input
            name="treatment_recommendation"
            defaultValue={draft.treatmentRecommendation}
            className="rounded-full border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#394642]">
          Email recommendation
          <input
            name="email_recommendation"
            defaultValue={draft.emailRecommendation}
            className="rounded-full border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[#394642]">
          Follow-up actions
          <textarea
            name="follow_up_actions"
            defaultValue={draft.followUpActions.join("\n")}
            rows={4}
            className="rounded-[22px] border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 leading-7 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#394642]">
          Outstanding tasks
          <textarea
            name="outstanding_tasks"
            defaultValue={draft.outstandingTasks.join("\n")}
            rows={4}
            className="rounded-[22px] border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 leading-7 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <label className="grid gap-2 text-sm font-medium text-[#394642]">
          SMS recommendation
          <textarea
            name="sms_recommendation"
            defaultValue={draft.smsRecommendation}
            rows={4}
            className="rounded-[22px] border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 leading-7 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
          />
        </label>
        <section className="rounded-[24px] border border-[#edf2f0] bg-[linear-gradient(180deg,#f7fbfa_0%,#ffffff_100%)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Saved as audit trail</p>
          <p className="mt-3 text-sm leading-7 text-[#52615d]">
            This action writes the edited summary to the clinic&apos;s audit log so the receptionist draft is preserved without changing the live call record.
          </p>
        </section>
      </div>
    </form>
  );
}
