import jwt from "jsonwebtoken";
import { getDb } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "default_super_secret_for_dev";

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function getUserFromRequest(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  return verifyToken(token);
}

export async function requireAdmin(req) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") {
    return null;
  }
  return user;
}
