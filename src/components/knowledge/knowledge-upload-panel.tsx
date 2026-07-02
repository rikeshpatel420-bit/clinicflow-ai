"use client";

import { useMemo, useState } from "react";

const acceptedTypes = ["PDF", "Word", "Policies", "Pricing", "Services", "FAQs", "Emergency procedures"];

export function KnowledgeUploadPanel() {
  const [files, setFiles] = useState<File[]>([]);

  const fileSummaries = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        type: file.type || "document",
      })),
    [files],
  );

  return (
    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <article className="rounded-[30px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
        <p className="text-sm font-semibold text-[#087968]">Document intake</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">Upload the knowledge that shapes the receptionist</h2>
        <p className="mt-3 text-sm leading-6 text-[#65736f]">
          Add documents that explain how the business works. The platform can then preview extracted knowledge before it is used in the AI
          prompt set.
        </p>

        <label className="mt-5 grid cursor-pointer gap-3 rounded-[28px] border border-dashed border-[#cdd8d5] bg-[#fbfdfc] p-5 transition hover:border-[#9db2ad] hover:bg-white">
          <span className="text-sm font-semibold text-[#10201d]">Drop files here or click to browse</span>
          <span className="text-sm leading-6 text-[#65736f]">PDF, DOCX, policies, pricing lists, service menus, FAQs, and emergency procedures.</span>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
        </label>

        <div className="mt-5 grid gap-2">
          {acceptedTypes.map((type) => (
            <div key={type} className="flex items-center justify-between gap-3 rounded-[20px] border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
              <span className="font-medium text-[#10201d]">{type}</span>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Supported</span>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-[30px] border border-[#dbe6e2] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbf9_100%)] p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
        <p className="text-sm font-semibold text-[#087968]">Extracted preview</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">Preview the knowledge before it reaches the prompt</h2>
        <p className="mt-3 text-sm leading-6 text-[#65736f]">
          This preview shows the structure the platform can use for receptionist answers, booking rules, and emergency handling.
        </p>

        <div className="mt-5 grid gap-3">
          {fileSummaries.length > 0 ? (
            fileSummaries.map((file) => (
              <div key={file.name} className="rounded-[24px] border border-[#edf2f0] bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#10201d]">{file.name}</p>
                    <p className="mt-1 text-sm text-[#65736f]">{file.type}</p>
                  </div>
                  <span className="rounded-full border border-[#c8eee6] bg-[#f7fffd] px-3 py-1 text-xs font-semibold text-[#087968]">{file.size}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#5d6d68]">
                  Preview only: the extracted facts from this document would be mapped into the AI knowledge centre and onboarding rules.
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-[#dbe6e2] bg-white p-5 text-sm leading-7 text-[#65736f]">
              No documents selected yet. Add a pricing PDF, emergency policy, or service list to preview the extracted knowledge.
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
