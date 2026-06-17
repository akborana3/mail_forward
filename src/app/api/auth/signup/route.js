import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { signToken } from "@/lib/auth";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = await getDb();

    // Check if user exists
    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = {
      id: uuidv4(),
      email,
      password_hash,
      role: "user",
      created_at: new Date().toISOString()
    };

    db.users.push(newUser);
    await saveDb(db);

    const token = signToken(newUser);

    return NextResponse.json({ token, user: { id: newUser.id, email: newUser.email, role: newUser.role } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
