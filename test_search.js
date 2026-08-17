import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { initSearchEngine, getSuggestions } from './src/services/search.service.js';

dotenv.config();

async function runTest() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    
    await initSearchEngine();
    
    const queries = ["vi", "visiting", "visihng", "visihng crd", "card visiting", "xyzabc"];
    
    console.log("\n====================================");
    for (const q of queries) {
       console.log(`\nTesting query: "${q}"`);
       const res = getSuggestions(q);
       console.log(JSON.stringify(res, null, 2));
    }
    console.log("\n====================================");
    
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTest();
