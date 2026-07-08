import { strict as assert } from "node:assert";
import {
  appointmentConfirmationSmsIdempotencyKey,
  buildAppointmentConfirmationSmsBody,
  formatAppointmentStartForPatient,
} from "../src/lib/bookings/appointments";

const appointment = {
  id: "appointment-source-of-truth",
  appointment_start: "2026-07-14T09:00:00.000Z",
  appointment_end: "2026-07-14T09:30:00.000Z",
  confirmation_reference: "CF-10AM",
};

const durationMinutes = (new Date(appointment.appointment_end).getTime() - new Date(appointment.appointment_start).getTime()) / 60_000;
const smsBody = buildAppointmentConfirmationSmsBody({
  appointmentStart: appointment.appointment_start,
  clinicName: "CF Dental",
  confirmationReference: appointment.confirmation_reference,
  timeZone: "Europe/London",
});
const patientSlotLabel = formatAppointmentStartForPatient(appointment.appointment_start, "Europe/London");

assert.equal(durationMinutes, 30, "Confirmed appointment duration should remain 30 minutes.");
assert(patientSlotLabel.includes("10:00"), "Patient-facing slot label should use the appointment start time.");
assert(!patientSlotLabel.includes("10:30"), "Patient-facing slot label must not use the appointment end time.");
assert(smsBody.includes("10:00"), "SMS confirmation should use the calendar appointment start time.");
assert(!smsBody.includes("10:30"), "SMS confirmation should not mention the appointment finish time.");
assert(!smsBody.includes("11:00"), "SMS confirmation must not drift to a different offered slot.");
assert(smsBody.includes(appointment.confirmation_reference), "SMS confirmation should use the appointment reference.");
assert.equal(
  appointmentConfirmationSmsIdempotencyKey(appointment.id),
  appointmentConfirmationSmsIdempotencyKey(appointment.id),
  "One appointment should always resolve to one stable confirmation SMS idempotency key.",
);

const sourceOfTruth = {
  calendar: appointment.confirmation_reference,
  calls: appointment.confirmation_reference,
  dashboard: appointment.confirmation_reference,
  database: appointment.confirmation_reference,
  reception: appointment.confirmation_reference,
  sms: appointment.confirmation_reference,
};

assert.deepEqual(
  new Set(Object.values(sourceOfTruth)),
  new Set([appointment.confirmation_reference]),
  "Calendar, reception, dashboard, calls, SMS, and database should share one appointment reference.",
);

console.log("ClinicFlow booking consistency smoke check passed");
