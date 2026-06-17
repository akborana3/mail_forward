import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(req) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  return NextResponse.json(db.aliases);
}

export async function POST(req) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { alias, destination_email } = await req.json();

    if (!alias || !destination_email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = await getDb();

    if (db.aliases.find(a => a.alias === alias)) {
      return NextResponse.json({ error: "Alias already exists" }, { status: 400 });
    }

    const newAlias = {
      id: uuidv4(),
      alias,
      destination_email,
      created_at: new Date().toISOString()
    };

    db.aliases.push(newAlias);
    await saveDb(db);

    return NextResponse.json(newAlias);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
