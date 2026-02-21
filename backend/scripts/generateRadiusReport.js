const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

const User = require('../models/User');

const CENTER = {
  lng: 72.64893454224435,
  lat: 23.419571372072653,
};

const RADIUS_KM = 10;

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function main() {
  dns.setServers(['8.8.8.8', '1.1.1.1']);

  const emailsFile = path.join(__dirname, 'TEST_USER_EMAILS.txt');
  const raw = fs.readFileSync(emailsFile, 'utf8');
  const emailsSection = raw.split('## Emails Only')[1] || '';
  const emails = emailsSection
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_FALLBACK;
  await mongoose
    .connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    })
    .catch(async (err) => {
      if (String(err.message).includes('querySrv')) {
        await mongoose.connect(process.env.MONGO_URI_FALLBACK, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          family: 4,
        });
      } else {
        throw err;
      }
    });

  const users = await User.find({ email: { $in: emails } })
    .select('name email location')
    .lean();

  const emailToUser = new Map(users.map((u) => [u.email, u]));
  const orderedUsers = emails.map((e) => emailToUser.get(e)).filter(Boolean);

  const enriched = orderedUsers.map((user) => {
    const [lng, lat] = user.location.coordinates;
    const distanceKm = haversineDistanceKm(CENTER.lat, CENTER.lng, lat, lng);
    return {
      name: user.name,
      email: user.email,
      lng,
      lat,
      distanceKm,
    };
  });

  const inRadius = enriched.filter((u) => u.distanceKm <= RADIUS_KM);
  const outRadius = enriched.filter((u) => u.distanceKm > RADIUS_KM);

  const formatLines = (arr) =>
    arr
      .map(
        (u, idx) =>
          `${idx + 1}. ${u.email} (${u.name}) | distance=${u.distanceKm.toFixed(3)} km | [lng,lat]=[${u.lng.toFixed(6)}, ${u.lat.toFixed(6)}]`
      )
      .join('\n');

  const report = [
    `CENTER: [${CENTER.lng}, ${CENTER.lat}]`,
    `RADIUS: ${RADIUS_KM} km`,
    `TOTAL_SEEDED_FOUND: ${enriched.length}`,
    `IN_RADIUS_COUNT: ${inRadius.length}`,
    `OUT_RADIUS_COUNT: ${outRadius.length}`,
    '',
    `=== IN RADIUS (<= ${RADIUS_KM} km) ===`,
    formatLines(inRadius),
    '',
    `=== OUT RADIUS (> ${RADIUS_KM} km) ===`,
    formatLines(outRadius),
    '',
  ].join('\n');

  const outPath = path.join(__dirname, 'RADIUS_CLASSIFICATION_REPORT.txt');
  fs.writeFileSync(outPath, report, 'utf8');

  console.log(report);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('ERROR:', err.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
