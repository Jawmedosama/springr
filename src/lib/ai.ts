/** Appels à l'API Claude, côté serveur uniquement. */

/**
 * Retire du texte d'un CV ce qui n'a pas à partir chez l'IA : e-mails, téléphones,
 * adresses (rue + numéro, code postal), dates de naissance.
 */
export function scrub(text = ""): string {
  return text
    .slice(0, 6000)
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[e-mail]")
    .replace(/(\+\d{2,3}|\b00\d{2}|\b0)[ ./]?[1-9](?:[ ./]?\d){7,8}\b/g, "[téléphone]")
    .replace(/\b\d{1,2}[/.-]\d{1,2}[/.-](19|20)\d{2}\b/g, "[date]")
    .replace(/\b[1-9]\d{3}\b(?=\s+[A-ZÀ-Ý][\p{L}-]+)/gu, "[code postal]")
    .replace(
      /\b(rue|avenue|av\.|boulevard|bd|chaussée|place|chemin|allée|straat|laan|steenweg|plein|weg)\b[^\n,]{0,40}\d+\w?/gi,
      "[adresse]",
    );
}

export async function askClaude(prompt: string, maxTokens = 900): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    return data.content?.find((c) => c.type === "text")?.text?.trim() || null;
  } catch {
    return null;
  }
}
