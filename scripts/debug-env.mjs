import { readFileSync } from "node:fs";

const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.trim().match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/[\r"']/g, "").trim();
}

const k = env.SUPABASE_SERVICE_ROLE_KEY || "";
const a = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const u = env.NEXT_PUBLIC_SUPABASE_URL || "";

console.log("URL host:", u.replace(/^https?:\/\//, "").slice(0, 40));
console.log("service len:", k.length, "segments:", k.split(".").length);
console.log("anon len:", a.length, "segments:", a.split(".").length);

if (k.split(".").length === 3) {
  const payload = JSON.parse(
    Buffer.from(k.split(".")[1], "base64url").toString("utf8")
  );
  console.log("service payload ref:", payload.ref, "role:", payload.role, "iss:", payload.iss);
}
if (a.split(".").length === 3) {
  const payload = JSON.parse(
    Buffer.from(a.split(".")[1], "base64url").toString("utf8")
  );
  console.log("anon payload ref:", payload.ref, "role:", payload.role, "iss:", payload.iss);
}