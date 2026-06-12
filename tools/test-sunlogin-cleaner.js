#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: node tools/test-sunlogin-cleaner.js response.json");
  process.exit(1);
}

const cleanerPath = path.resolve(__dirname, "../sunlogin/sunlogin-ad-cleaner.js");
const body = fs.readFileSync(inputPath, "utf8");

global.$response = { body };
global.$done = (result) => {
  process.stdout.write(result.body || "");
};

delete require.cache[cleanerPath];
require(cleanerPath);

