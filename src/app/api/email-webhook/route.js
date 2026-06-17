import { NextResponse } from "next/server";
import { simpleParser } from "mailparser";
import { getDb } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const DOMAIN = process.env.DOMAIN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

export async function POST(req) {
  try {
    // Basic auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cloudflare worker should send { rawEmail: string, to: string, from: string }
    const { rawEmail, to, from } = await req.json();

    if (!rawEmail || !to) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Parse the TO address to extract alias
    const toAddress = to.toLowerCase();

    // Check if domain matches
    if (!toAddress.endsWith(`@${DOMAIN}`)) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
    }

    const aliasName = toAddress.split('@')[0];

    const db = await getDb();

    const aliasRecord = db.aliases.find(a => a.alias === aliasName);

    if (!aliasRecord) {
      return NextResponse.json({ error: "Alias not found" }, { status: 404 });
    }

    // Parse the raw email to extract parts
    const parsedEmail = await simpleParser(rawEmail);

    const destination = aliasRecord.destination_email;

    const attachments = parsedEmail.attachments ? parsedEmail.attachments.map(att => ({
      filename: att.filename,
      content: att.content.toString("base64")
    })) : [];

    // Forward using Resend
    await resend.emails.send({
      from: `${aliasName}@${DOMAIN}`,
      to: destination,
      subject: parsedEmail.subject || "No Subject",
      html: parsedEmail.html || "",
      text: parsedEmail.text || "",
      reply_to: from, // from address of the original sender
      attachments
    });

    return NextResponse.json({ success: true, forwardedTo: destination });

  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
