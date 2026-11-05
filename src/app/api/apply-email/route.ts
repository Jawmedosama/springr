import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const DAILY_LIMIT = 20;
const MAX_PDF = 4 * 1024 * 1024;

/** Compteurs par instance : un garde-fou de plus, pas une limite exacte. */
const sentOffers = new Set<string>();
let day = "";
let sentToday = 0;

const configured = () => Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

export function GET() {
  return NextResponse.json({ enabled: configured() });
}

/** Cette route envoie depuis la boîte Gmail du propriétaire : lui seul peut l'utiliser. */
async function isOwner(req: Request): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  const owner = (process.env.APPLY_OWNER_EMAIL ?? process.env.GMAIL_USER ?? "").toLowerCase();
  if (!url || !key || !token || !owner) return false;
  const { data } = await createClient(url, key).auth.getUser(token);
  return data.user?.email?.toLowerCase() === owner;
}

export async function POST(req: Request) {
  if (!configured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (!(await isOwner(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await req.formData();
  const to = String(form.get("to") ?? "").trim();
  const subject = String(form.get("subject") ?? "").slice(0, 200);
  const body = String(form.get("body") ?? "").slice(0, 10000);
  const offerId = String(form.get("offerId") ?? "");
  const cv = form.get("cv");

  if (!/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(to) || !subject || !body || !offerId) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (!(cv instanceof File) || cv.type !== "application/pdf" || cv.size > MAX_PDF) {
    return NextResponse.json({ error: "cv" }, { status: 400 });
  }
  if (sentOffers.has(offerId)) return NextResponse.json({ error: "already_sent" }, { status: 409 });

  const today = new Date().toISOString().slice(0, 10);
  if (day !== today) {
    day = today;
    sentToday = 0;
  }
  if (sentToday >= DAILY_LIMIT) return NextResponse.json({ error: "daily_limit" }, { status: 429 });

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  try {
    await transport.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text: body,
      attachments: [{ filename: cv.name, content: Buffer.from(await cv.arrayBuffer()), contentType: "application/pdf" }],
    });
  } catch {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
  sentOffers.add(offerId);
  sentToday += 1;
  return NextResponse.json({ ok: true });
}
