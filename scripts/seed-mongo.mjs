import dns from "dns";
import { readFileSync } from "fs";
import { MongoClient } from "mongodb";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const uri = env.match(/MONGODB_URI=(.*)/)[1].trim();
const dbName = (env.match(/MONGODB_DB=(.*)/) || [])[1]?.trim() || "dyno-snus";
const data = JSON.parse(readFileSync(new URL("../data/db.json", import.meta.url), "utf8"));

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

const collections = {
  site: [{ id: "site", ...data.site }],
  products: data.products,
  pricing: data.pricing,
  incentives: data.incentives,
  users: data.users,
  orders: data.orders,
  leads: data.leads,
};

for (const [name, docs] of Object.entries(collections)) {
  const collection = db.collection(name);
  if (!docs.length) {
    console.log(`${name}: empty source, skipped`);
    continue;
  }
  const missing = [];
  for (const doc of docs) {
    const existing = doc.id ? await collection.findOne({ id: doc.id }) : null;
    if (!existing) missing.push(doc);
  }
  if (!missing.length) {
    console.log(`${name}: all ${docs.length} already present, skipped`);
    continue;
  }
  await collection.insertMany(missing);
  console.log(`${name}: inserted ${missing.length}, kept ${docs.length - missing.length}`);
}

await db.collection("products").createIndex({ slug: 1 }, { unique: true });
await db.collection("users").createIndex({ email: 1 }, { unique: true });
await db.collection("orders").createIndex({ userId: 1, createdAt: -1 });

const names = await db.listCollections().toArray();
console.log(`database ${dbName}: ${names.map((item) => item.name).join(", ")}`);
await client.close();
