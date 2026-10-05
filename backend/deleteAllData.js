// deleteAllData.js
// Drops ALL non-system databases on your MongoDB Atlas cluster.
// Usage (inside the backend folder):  node deleteAllData.js

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

const URI = process.env.MONGODB_URI;
const SYSTEM_DBS = ['admin', 'local', 'config'];

if (!URI) {
  console.error('MONGODB_URI not found. Make sure .env exists in this folder.');
  process.exit(1);
}

function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

(async () => {
  try {
    await mongoose.connect(URI);
    console.log('Connected to Atlas.');

    const { databases } = await mongoose.connection.db.admin().listDatabases();
    const targets = databases.map((d) => d.name).filter((n) => !SYSTEM_DBS.includes(n));

    if (targets.length === 0) {
      console.log('No user databases found. Nothing to delete.');
      process.exit(0);
    }

    console.log('\nThese databases will be PERMANENTLY deleted:');
    targets.forEach((n) => console.log('  -', n));

    const answer = await confirm('\nType DELETE to confirm: ');
    if (answer !== 'DELETE') {
      console.log('Cancelled. Nothing was deleted.');
      process.exit(0);
    }

    for (const name of targets) {
      await mongoose.connection.client.db(name).dropDatabase();
      console.log('Dropped:', name);
    }

    console.log('\nDone. All data deleted.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();