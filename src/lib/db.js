import { downloadFile, uploadFile } from "@huggingface/hub";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const HF_API_KEY = process.env.HF_API_KEY;
const HF_DATASET_REPO = process.env.HF_DATASET_REPO;

const DEFAULT_DB = {
  users: [],
  aliases: [],
};

async function initDb(currentDb) {
  let changed = false;

  if (!currentDb.users) currentDb.users = [];
  if (!currentDb.aliases) currentDb.aliases = [];

  // Check if admin user exists
  const adminExists = currentDb.users.some(u => u.role === "admin");
  if (!adminExists && process.env.ADMIN_PASSWORD) {
    console.log("Initializing admin user...");
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
    currentDb.users.push({
      id: uuidv4(),
      email: "admin", // Admin uses 'admin' as email/username for simplicity or require an env for admin email? We will use "admin"
      password_hash,
      role: "admin",
      created_at: new Date().toISOString()
    });
    changed = true;
  }
  return changed;
}

export async function getDb() {
  if (!HF_API_KEY || !HF_DATASET_REPO) {
    console.warn("HF_API_KEY or HF_DATASET_REPO is missing. Using in-memory DB for now.");
    return DEFAULT_DB; // fallback or throw error
  }

  try {
    const response = await downloadFile({
      repo: { type: "dataset", name: HF_DATASET_REPO },
      path: "db.json",
      credentials: { accessToken: HF_API_KEY }
    });

    if (!response) {
      // File doesn't exist yet, return default
      return DEFAULT_DB;
    }

    const text = await response.text();
    const data = JSON.parse(text);

    const changed = await initDb(data);
    if (changed) {
      await saveDb(data);
    }

    return data;
  } catch (error) {
    // If file not found, handle it (usually returns 404 or throws)
    console.error("Error fetching db.json:", error);
    const data = JSON.parse(JSON.stringify(DEFAULT_DB));
    const changed = await initDb(data);
    if (changed) {
      await saveDb(data);
    }
    return data;
  }
}

export async function saveDb(data) {
  if (!HF_API_KEY || !HF_DATASET_REPO) return;

  const content = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });

  await uploadFile({
    repo: { type: "dataset", name: HF_DATASET_REPO },
    credentials: { accessToken: HF_API_KEY },
    file: {
      path: "db.json",
      content
    },
    commitTitle: "Update db.json"
  });
}
