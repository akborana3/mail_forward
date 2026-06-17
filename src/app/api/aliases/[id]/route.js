import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req, { params }) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const { alias, destination_email } = await req.json();

    const db = await getDb();

    const index = db.aliases.findIndex(a => a.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check if alias is being changed to something that already exists
    if (alias && alias !== db.aliases[index].alias) {
      if (db.aliases.find(a => a.alias === alias)) {
        return NextResponse.json({ error: "Alias already exists" }, { status: 400 });
      }
    }

    db.aliases[index] = {
      ...db.aliases[index],
      alias: alias || db.aliases[index].alias,
      destination_email: destination_email || db.aliases[index].destination_email
    };

    await saveDb(db);

    return NextResponse.json(db.aliases[index]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const db = await getDb();

    const index = db.aliases.findIndex(a => a.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    db.aliases.splice(index, 1);
    await saveDb(db);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
