import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { lines } from "@/lib/brand-kits";
import type { BrandKit } from "@/lib/types";

// Writes a campaign email's subject line and body with Claude, in the voice of
// the campaign's brand kit. Needs ANTHROPIC_API_KEY in .env.local.

const MODEL = "claude-sonnet-5-5";

const SYSTEM_PROMPT = `You write marketing emails for a solo marketer who runs one brand. Your job is to write an email that sounds unmistakably like that brand.

Tone comes first. Before anything else, the email must match the brand's voice:
- Study the brand voice description and write the way that brand talks: its formality, energy, sentence length, humor, and word choice. If the voice is formal, be formal throughout; if it is chaotic and lowercase, be chaotic and lowercase throughout. Do not drift back to a generic marketing tone partway through.
- Follow every "do" in the brand kit that fits an email. Never do anything on the "don'ts" list.
- Apply the voice to the subject line too, not just the body.
- If the brand kit has no voice description, write in a clear, warm, plain tone.

Content:
- Cover what the brief asks for. Do not invent discounts, prices, dates, deadlines, product names, or statistics that are not in the brief.
- Keep it short enough to read on a phone: a greeting, two to four short paragraphs, one call to action, and a sign-off from the brand.
- Write the call to action as a button label in square brackets on its own line, e.g. [Shop the sale]. Use exactly one.
- The body is plain text. Use blank lines between paragraphs. No markdown, no HTML, no placeholders like {first_name}.
- The subject line should be under about 60 characters and make someone want to open the email.`;

// Structured output: guarantees the response is JSON in this shape.
const EMAIL_SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
  },
  required: ["subject", "body"],
  additionalProperties: false,
} as const;

export type GeneratedEmail = { subject: string; body: string };

function brandKitForPrompt(kit: BrandKit | null): string {
  if (!kit) return "No brand kit is attached. Use a clear, warm, plain tone.";

  const parts = [`Brand name: ${kit.name}`, `Voice: ${kit.voice?.trim() || "(not set)"}`];
  const dos = lines(kit.dos);
  const donts = lines(kit.donts);
  parts.push(`Do's:\n${dos.length ? dos.map((d) => `- ${d}`).join("\n") : "(none)"}`);
  parts.push(`Don'ts:\n${donts.length ? donts.map((d) => `- ${d}`).join("\n") : "(none)"}`);
  return parts.join("\n\n");
}

export async function generateEmail(input: {
  name: string;
  brief: string;
  brandKit: BrandKit | null;
}): Promise<GeneratedEmail> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // If Sonnet 5.5's safety checks decline, the API retries on a suitable model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: EMAIL_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Write the email for this campaign.

<brand_kit>
${brandKitForPrompt(input.brandKit)}
</brand_kit>

<campaign>
Campaign name (internal, not shown to readers): ${input.name}

Brief:
${input.brief}
</campaign>`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(
      `Claude declined to write this email (${response.stop_details?.category ?? "no category"}).`,
    );
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Claude's response was cut off before it finished.");
  }

  const text = response.content.find((block) => block.type === "text")?.text;
  if (!text) throw new Error("Claude returned no text.");

  const parsed = JSON.parse(text) as GeneratedEmail;
  return { subject: parsed.subject.trim(), body: parsed.body.trim() };
}
