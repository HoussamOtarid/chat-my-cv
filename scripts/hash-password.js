#!/usr/bin/env node

import bcrypt from 'bcrypt';

const password = process.argv[2];

if (!password) {
    console.log('Usage: node scripts/hash-password.js <password>');
    process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
const base64Hash = Buffer.from(hash).toString('base64');

console.log('\nPassword hash:');
console.log(hash);
console.log('\nBase64 encoded (for .env file):');
console.log(base64Hash);
console.log('\nAdd to your .env file:');
console.log(`ADMIN_PASSWORD_HASH=${base64Hash}\n`);
