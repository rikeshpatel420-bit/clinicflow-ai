import { getCommunicationSla, scoreEngagement } from "@/lib/communications/engagement";

export const engagementDemo = {
  metrics: [
    { label: "Engagement score", value: "78", note: "demo average" },
    { label: "Replies awaiting triage", value: "9", note: getCommunicationSla(34) },
    { label: "Campaign conversion", value: "24%", note: "reactivation demo" },
    { label: "Reminder protection", value: "GBP 1.8k", note: "no-show risk" },
  ],
  threads: [
    {
      id: "thread-1",
      patient: "Demo patient A",
      channel: "sms",
      owner: "Maya Shah",
      tags: ["implant", "high intent"],
      score: scoreEngagement({ booked: false, estimatedValue: 950, highIntent: true, minutesSinceLastContact: 18, replied: true }),
      status: "staff review",
    },
    {
      id: "thread-2",
      patient: "Demo patient B",
      channel: "email",
      owner: "Reception pool",
      tags: ["hygiene", "reactivation"],
      score: scoreEngagement({ booked: false, estimatedValue: 160, highIntent: false, minutesSinceLastContact: 72, replied: false }),
      status: "follow-up scheduled",
    },
    {
      id: "thread-3",
      patient: "Demo patient C",
      channel: "whatsapp",
      owner: "James Carter",
      tags: ["reminder", "no-show risk"],
      score: scoreEngagement({ booked: true, estimatedValue: 220, highIntent: true, minutesSinceLastContact: 12, replied: true }),
      status: "confirmed",
    },
  ],
  timeline: [
    { id: "comm-1", title: "Inbound reply received", detail: "High-intent implant enquiry moved to staff review.", time: "09:10" },
    { id: "comm-2", title: "Internal note added", detail: "Reception marked preferred callback window.", time: "09:14" },
    { id: "comm-3", title: "Reminder queued", detail: "Appointment confirmation prepared in deterministic demo mode.", time: "09:42" },
    { id: "comm-4", title: "Campaign metric updated", detail: "Reactivation cohort conversion recalculated.", time: "10:05" },
  ],
  reminders: [
    { id: "rem-1", patient: "Demo patient C", appointment: "Tomorrow 09:30", risk: "medium", action: "Confirm attendance before 15:00" },
    { id: "rem-2", patient: "Demo patient D", appointment: "Friday 14:00", risk: "high", action: "Call if no reply to reminder draft" },
  ],
  campaignAnalytics: [
    { label: "Hygiene reactivation", sent: 120, replies: 28, bookings: 11 },
    { label: "Treatment follow-up", sent: 42, replies: 13, bookings: 6 },
    { label: "No-show prevention", sent: 36, replies: 24, bookings: 0 },
  ],
};

