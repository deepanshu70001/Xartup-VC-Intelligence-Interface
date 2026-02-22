import Groq from "groq-sdk";
import type { ScoutContextCompany } from "../types";

function buildCompanyContext(companies: ScoutContextCompany[]) {
  return companies
    .map((company, index) => {
      const enrichmentSummary = company.enrichment?.summary || "";
      const keywords = (company.enrichment?.keywords || []).slice(0, 8).join(", ");
      const signals = (company.enrichment?.derived_signals || []).slice(0, 4).join(" | ");

      return [
        `${index + 1}. ${company.name}`,
        `Industry: ${company.industry || "Unknown"} | Stage: ${company.stage || "Unknown"} | Location: ${company.location || "Unknown"}`,
        `Employees: ${company.employee_count || "Unknown"} | Funding: ${company.total_funding || "Unknown"}`,
        `Tags: ${(company.tags || []).slice(0, 8).join(", ") || "None"}`,
        `Description: ${company.description || "N/A"}`,
        `Enrichment Summary: ${enrichmentSummary || "N/A"}`,
        `Enrichment Keywords: ${keywords || "N/A"}`,
        `Derived Signals: ${signals || "N/A"}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildSystemPrompt(thesis: unknown, companyContext: string) {
  return [
    "You are Scout, a thesis-aware VC copilot.",
    "You help with sourcing, prioritization, and diligence.",
    "Use only the provided thesis and company context.",
    "If data is missing, call it out briefly and provide best-effort recommendations.",
    "Respond with concise, structured guidance suitable for an investment team.",
    "Formatting rules:",
    "- Use short paragraphs and bullet points.",
    "- For rankings, use numbered lines (1., 2., 3.) with one company per line.",
    "- Use plain text markdown only for bold company names (e.g., **Company**).",
    "- Avoid one giant paragraph.",
    "",
    `THESIS CONTEXT (JSON): ${JSON.stringify(thesis).slice(0, 3000)}`,
    "",
    `COMPANY CONTEXT:\n${companyContext || "No company context provided."}`,
  ].join("\n");
}

export async function generateScoutReply({
  apiKey,
  message,
  thesis,
  companies,
}: {
  apiKey: string;
  message: string;
  thesis: unknown;
  companies: ScoutContextCompany[];
}) {
  const companyContext = buildCompanyContext(companies);
  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    messages: [
      { role: "system", content: buildSystemPrompt(thesis, companyContext) },
      { role: "user", content: message.slice(0, 2000) },
    ],
  });

  const reply = completion.choices[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("No response returned from model");
  }

  return {
    reply,
    timestamp: new Date().toISOString(),
  };
}
