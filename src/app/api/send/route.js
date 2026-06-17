import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/auth";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fromAlias, to, subject, body, isHtml = false } = await req.json();

    if (!fromAlias || !to || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payload = {
      from: fromAlias, // Expecting full email e.g. contact@akay.codes
      to,
      subject,
    };

    if (isHtml) {
      payload.html = body;
    } else {
      payload.text = body;
    }

    const data = await resend.emails.send(payload);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Send API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
