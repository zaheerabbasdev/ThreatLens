// One-off helper: pre-downloads and caches the mongodb-memory-server binary
// with no artificial timeout, independent of vitest's hookTimeout (120s in
// vitest.mongo.config.ts — too short for a slow connection to finish a
// ~600MB download inside a single test hook). Run this once, then
// `npm run test:mongo` starts fast because the binary is already cached.
import { MongoBinary } from "mongodb-memory-server-core";

console.log("Pre-downloading MongoDB binary...");
const start = Date.now();
const binPath = await MongoBinary.getPath({});
console.log(`Done in ${Math.round((Date.now() - start) / 1000)}s: ${binPath}`);
