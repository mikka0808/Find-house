import fs from "fs";
import path from "path";

const root = path.resolve(process.cwd(), "..");
const targetPublic = path.resolve(process.cwd(), "public");

const pairs = [
  { from: path.join(root, "data"), to: path.join(targetPublic, "data") },
  { from: path.join(root, "config"), to: path.join(targetPublic, "config") }
];

for (const { from, to } of pairs) {
  if (!fs.existsSync(from)) continue;
  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from)) {
    fs.copyFileSync(path.join(from, entry), path.join(to, entry));
  }
  console.log(`Synced ${from} -> ${to}`);
}
