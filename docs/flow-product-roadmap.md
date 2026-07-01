# Flow Product Roadmap

Directional roadmap for future Flow verticals.

| Product | Target customer | Key workflows | Pricing hypothesis | Integrations needed | MVP features | Main risks |
|---|---|---|---|---|---|---|
| ClinicFlow | Private dental clinics | missed-call recovery, triage, callbacks, patient reactivation | premium subscription per location | Twilio, Supabase, OpenAI, calendar | live call capture, SMS recovery, AI summaries | compliance and call safety |
| PlumbFlow | Plumbing firms | emergency repairs, quote capture, engineer booking | trade SMB subscription per team | Twilio, calendar, maps, SMS | call triage, job capture, safety escalation | gas safety handling |
| SparkFlow | Electricians | outage triage, repair booking, quote follow-up | per seat + usage | Twilio, calendar, photo upload | lead capture, emergency triage, callback routing | safety advice boundaries |
| HeatFlow | HVAC / heat pumps | quote qualification, survey booking, aftercare | higher ticket tier | Twilio, forms, CRM, scheduling | intake, photo collection, survey booking | long sales cycle |
| BuildFlow | Builders / contractors | estimate requests, site survey booking, project qualification | project-based pricing | Twilio, CRM, quoting, document storage | inquiry capture, survey scheduling, quote handoff | fragmented trade workflows |
| CleanFlow | Cleaning companies | quote requests, recurring service bookings, reactivation | lower SMB price point | Twilio, scheduling, payments | quote capture, recurring booking, reminders | price sensitivity |
| AutoFlow | Garages / repair shops | service booking, MOT reminders, updates | tiered per location | Twilio, workshop system, reminders | call logging, booking requests, job updates | legacy system integration |
| LegalFlow | Law firms | client intake, matter screening, callback routing | premium compliance-led pricing | Twilio, CRM, e-sign, email | intake triage, matter routing, secure follow-up | compliance and jurisdiction |
| VetFlow | Veterinary clinics | appointment booking, emergency triage, reminders | per clinic subscription | Twilio, PMS, reminders | urgent triage, booking requests, recall SMS | safety and emotional calls |
| EstateFlow | Estate agents | valuation requests, viewing booking, lead follow-up | lead volume pricing | Twilio, CRM, calendar, email | lead capture, callback booking, qualification | competition and low switching costs |

## Notes

- Keep the platform generic.
- Add a new folder for each product profile.
- Reuse the shared conversation engine, workflow engine, and Twilio runtime.
- Avoid product-specific code in the core platform.

