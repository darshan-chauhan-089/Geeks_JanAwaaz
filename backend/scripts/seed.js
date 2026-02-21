/**
 * Seed script for CivicPulse — with comprehensive error handling and mock data fallback
 * 1. Clears users and issues
 * 2. Creates 5 Indian users within 10km radius around center
 * 3. Creates 1 issue at center
 * 4. Validates nearby user query
 * 5. Prints results and exits
 */

require('dotenv').config();
const mongoose = require('mongoose');

let User, Issue;

// ─── Constants ────────────────────────────────────────────────────────────────
const EARTH_RADIUS_KM = 6371;
const CENTER_LNG = 72.65200164862505;
const CENTER_LAT = 23.258729710247906;
const MAX_RADIUS_KM = 10;
const PASSWORD = 'Geeks@12345';

const INDIAN_NAMES = [
  'Aarav',
  'Ananya',
  'Arjun',
  'Diya',
  'Priya',
];

// ─── Helper: Generate random coordinates within radius ────────────────────────
/**
 * Generate a random coordinate within specified radius using spherical/haversine math.
 * @param {number} centerLng - Center longitude
 * @param {number} centerLat - Center latitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {[number, number]} [longitude, latitude]
 */
function generateRandomCoordinate(centerLng, centerLat, radiusKm) {
  const randomDistance = Math.random() * radiusKm;
  const randomBearing = Math.random() * 2 * Math.PI;

  const lat1 = (centerLat * Math.PI) / 180;
  const lon1 = (centerLng * Math.PI) / 180;

  const angularDistance = randomDistance / EARTH_RADIUS_KM;

  const lat2Rad = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
    Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(randomBearing)
  );

  const lon2Rad =
    lon1 +
    Math.atan2(
      Math.sin(randomBearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2Rad)
    );

  const lat2 = (lat2Rad * 180) / Math.PI;
  const lon2 = (lon2Rad * 180) / Math.PI;

  return [lon2, lat2];
}

// ─── Helper: Calculate distance between two coords (Haversine) ────────────────
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = EARTH_RADIUS_KM;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── Main seed function ────────────────────────────────────────────────────────
async function seed() {
  let usersData = [];
  let createdUsers = [];
  let issue = null;
  let nearbyUsers = [];

  try {
    console.log('[SEED] Starting seed process...');
    console.log(`[SEED] Center: [${CENTER_LNG}, ${CENTER_LAT}]`);
    console.log(`[SEED] Radius: ${MAX_RADIUS_KM}km`);

    // Lazy load models
    User = require('../models/User');
    Issue = require('../models/Issue');
    console.log('[SEED] Models loaded');

    // Try to connect with both URIs
    console.log('[SEED] Connecting to MongoDB...');

    const connectOptions = {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    };

    let connected = false;

    try {
      await mongoose.connect(process.env.MONGO_URI, connectOptions);
      console.log('[SEED] Connected via primary SRV URI');
      connected = true;
    } catch (srvErr) {
      console.log(`[SEED] Primary SRV failed: ${srvErr.message}`);

      if (process.env.MONGO_URI_FALLBACK) {
        try {
          await mongoose.connect(process.env.MONGO_URI_FALLBACK, connectOptions);
          console.log('[SEED] Connected via fallback non-SRV URI');
          connected = true;
        } catch (fallbackErr) {
          console.error(`[SEED] Fallback also failed: ${fallbackErr.message}`);
        }
      }
    }

    if (!connected) {
      throw new Error('Could not connect to MongoDB with any available URI');
    }

    // Clear existing data
    console.log('[SEED] Clearing users and issues...');
    await User.deleteMany({});
    await Issue.deleteMany({});
    console.log('[SEED] Cleared existing data');

    // Create 5 users
    console.log('[SEED] Generating coordinates for 5 users...');
    for (let i = 0; i < 5; i++) {
      const name = INDIAN_NAMES[i];
      const email = `${name.toLowerCase()}123@test.com`;
      const [lng, lat] = generateRandomCoordinate(
        CENTER_LNG,
        CENTER_LAT,
        MAX_RADIUS_KM
      );

      const distanceKm = calculateDistance(CENTER_LAT, CENTER_LNG, lat, lng);

      usersData.push({
        name,
        email,
        password: PASSWORD,
        role: 'citizen',
        isVerified: true,
        isActive: true,
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        credibilityScore: 50 + Math.floor(Math.random() * 50),
        verificationCount: Math.floor(Math.random() * 10),
        locationName: `Location ${i + 1}`,
      });

      console.log(
        `  [${i + 1}] ${name} - [${lng.toFixed(4)}, ${lat.toFixed(4)}] - ${distanceKm.toFixed(2)}km from center`
      );
    }

    console.log('[SEED] Inserting users...');
    createdUsers = await User.insertMany(usersData);
    console.log(`[SEED] Created ${createdUsers.length} users`);

    // Create 1 issue at center
    console.log('[SEED] Creating issue at center...');
    issue = await Issue.create({
      title: 'Pothole on Main Street',
      description: 'Large pothole blocking traffic on main street near the city center.',
      category: 'road',
      location: {
        type: 'Point',
        coordinates: [CENTER_LNG, CENTER_LAT],
        address: 'Main Street, Downtown',
        city: 'Central City',
        ward: 'Downtown Ward',
      },
      createdBy: createdUsers[0]._id,
      status: 'Pending',
    });
    console.log(`[SEED] Created issue: ${issue._id}`);

    // Query nearby users (2km)
    console.log('[SEED] Querying nearby users within 2km...');
    nearbyUsers = await User.find({
      location: {
        $near: {
          $geometry: issue.location,
          $maxDistance: 2000,
        },
      },
      _id: { $ne: createdUsers[0]._id },
      isActive: true,
    }).select('name email location credibilityScore');

    console.log(`[SEED] Found ${nearbyUsers.length} users within 2km`);

    // Print results
    printResults(createdUsers, issue, nearbyUsers);

    // Disconnect
    await mongoose.disconnect();
    console.log('[SEED] Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error(`[SEED ERROR] ${error.message}`);

    // Still try to print mock results for demonstration
    if (usersData.length > 0) {
      console.log('[SEED] Printing generated data (before DB error)...\n');
      const mockCreated = usersData.map((u, idx) => ({
        ...u,
        _id: new mongoose.Types.ObjectId(),
      }));
      const mockIssue = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Pothole on Main Street',
        location: { type: 'Point', coordinates: [CENTER_LNG, CENTER_LAT] },
      };
      printResults(mockCreated, mockIssue, []);
    }

    process.exit(1);
  }
}

function printResults(users, issue, nearby) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('[RESULTS]');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total users created: ${users.length}`);
  console.log(`Issue created at: [${CENTER_LNG}, ${CENTER_LAT}]`);
  console.log(`Users within 2km of issue: ${nearby.length}`);

  console.log('\nCreated Users:');
  users.forEach((user, idx) => {
    const [lng, lat] = user.location.coordinates;
    const distKm = calculateDistance(CENTER_LAT, CENTER_LNG, lat, lng);
    console.log(
      `  ${idx + 1}. ${user.name} (${user.email}) - [${lng.toFixed(4)}, ${lat.toFixed(4)}] - ${distKm.toFixed(2)}km`
    );
  });

  if (nearby.length > 0) {
    console.log('\nUsers within 2km of issue:');
    nearby.forEach((user, idx) => {
      const [lng, lat] = user.location.coordinates;
      const distKm = calculateDistance(CENTER_LAT, CENTER_LNG, lat, lng);
      console.log(
        `  ${idx + 1}. ${user.name} (${user.email}) - [${lng.toFixed(4)}, ${lat.toFixed(4)}] - ${distKm.toFixed(2)}km`
      );
    });
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

// Run seed
seed();
