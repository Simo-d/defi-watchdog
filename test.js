// test-mongodb.js
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://charingane:Charingane123@smart-contract-audits.f4gim.mongodb.net/?retryWrites=true&w=majority&appName=smart-contract-audits";

async function testConnection() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB");
    const dbs = await client.db().admin().listDatabases();
    console.log("Databases:", dbs.databases.map(db => db.name));
  } catch (err) {
    console.error("Connection error:", err);
  } finally {
    await client.close();
  }
}

testConnection();
