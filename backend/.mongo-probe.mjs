import { MongoMemoryServer } from "mongodb-memory-server";

const mongod = await MongoMemoryServer.create({
  binary: { downloadDir: "d:/ThreatLens/backend/node_modules/.cache/mongodb-memory-server" },
});
console.log("STARTED:", mongod.getUri());
await mongod.stop();
console.log("STOPPED cleanly");
