#!/usr/bin/env node

const fs = require("fs");

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: node tools/analyze-har.js capture.har");
  process.exit(1);
}

const adWords = [
  "ad",
  "ads",
  "advert",
  "banner",
  "splash",
  "popup",
  "promotion",
  "promo",
  "marketing",
  "marquee",
  "carousel",
  "swiper",
  "notice"
];

const riskyWords = [
  "auth",
  "login",
  "token",
  "device",
  "host",
  "client",
  "terminal",
  "session",
  "connect",
  "control",
  "relay",
  "tunnel",
  "p2p",
  "stun",
  "turn",
  "heartbeat"
];

function scoreText(text, words) {
  const lower = String(text || "").toLowerCase();
  return words.reduce((score, word) => score + (lower.includes(word) ? 1 : 0), 0);
}

function bodyPreview(entry) {
  const text = entry.response && entry.response.content && entry.response.content.text;
  if (!text) return "";
  return String(text).slice(0, 400).replace(/\s+/g, " ");
}

const har = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const entries = (har.log && har.log.entries) || [];

const rows = entries.map((entry) => {
  const request = entry.request || {};
  const response = entry.response || {};
  const url = request.url || "";
  const preview = bodyPreview(entry);
  const combined = `${url} ${preview}`;
  return {
    method: request.method || "GET",
    status: response.status || 0,
    mime: (response.content && response.content.mimeType) || "",
    adScore: scoreText(combined, adWords),
    riskScore: scoreText(combined, riskyWords),
    url
  };
});

rows
  .filter((row) => row.adScore > 0 || row.riskScore > 0)
  .sort((a, b) => (b.adScore - a.adScore) || (b.riskScore - a.riskScore))
  .slice(0, 200)
  .forEach((row) => {
    const label = row.riskScore > 0 ? "CHECK" : "AD";
    console.log(
      `[${label}] ad=${row.adScore} risk=${row.riskScore} ${row.method} ${row.status} ${row.mime} ${row.url}`
    );
  });

