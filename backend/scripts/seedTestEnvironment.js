/**
 * seedTestEnvironment.js
 * 
 * Purpose:
 *  - Clear existing users + issues
 *  - Insert 50 test users with varied geolocation
 *    (30 within 10km, 20 between 20-50km from center)
 *  - Create 1 test issue at center location
 *  - Print statistics
 * 
 * Usage: node backend/scripts/seedTestEnvironment.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
require('dotenv').config();

const User = require('../models/User');
const Issue = require('../models/Issue');

// ─── Center Coordinates (Ahmedabad, India) ────────────────────────────────────
const CENTER_LNG = 72.64893454224435;
const CENTER_LAT = 23.419571372072653;

// ─── Indian Names (Non-repeating) ─────────────────────────────────────────────
const INDIAN_FIRST_NAMES = [
  'Aarav', 'Aditya', 'Arjun', 'Ashok', 'Amit',
  'Akshay', 'Ajay', 'Aman', 'Anshul', 'Arun',
  'Bhavesh', 'Brijesh', 'Bhuvan', 'Bhupendra', 'Bikram',
  'Chirag', 'Chandra', 'Chetan', 'Chaitanya', 'Cyril',
  'Deepak', 'Devendra', 'Dhiraj', 'Darshan', 'Dilip',
  'Eshan', 'Eshwar', 'Emraan', 'Ethan', 'Elias',
  'Farhan', 'Faisal', 'Faraz', 'Feroz', 'Flavio',
  'Gaurav', 'Girish', 'Govind', 'Gajendra', 'Ghanshyam',
  'Harsh', 'Harish', 'Harshal', 'Hemant', 'Hrishikesh',
  'Inder', 'Ishaan', 'Iqbal', 'Ishan', 'Ivan',
  'Jyoti', 'Jayesh', 'Jitin', 'Jatin', 'Jitendra',
  'Kapil', 'Kailash', 'Krunal', 'Kushal', 'Karim',
  'Laksh', 'Lokesh', 'Laxmikant', 'Leroy', 'Liam',
  'Manish', 'Manas', 'Manoj', 'Madhav', 'Mahesh',
  'Nikhil', 'Nitin', 'Neeraj', 'Naresh', 'Naveen',
  'Omprakash', 'Omkar', 'Ojas', 'Oskar', 'Owen',
  'Pavan', 'Pranav', 'Pratik', 'Param', 'Prabhat',
  'Qais', 'Qadir', 'Quinn', 'Quinton', 'Quentin',
  'Rajesh', 'Rahul', 'Ravi', 'Rajeev', 'Ritwik',
  'Sameer', 'Sanjay', 'Suresh', 'Sandeep', 'Saurav',
  'Tarun', 'Tushar', 'Tej', 'Tamizh', 'Tejas',
  'Uday', 'Ujjwal', 'Umar', 'Umesh', 'Ushman',
  'Vikram', 'Vishal', 'Vivek', 'Vinay', 'Viral',
  'Waqar', 'Waleed', 'Wayne', 'Wesley', 'Wilfred',
  'Xander', 'Xavier', 'Ximena', 'Xavi', 'Xiomara',
  'Yash', 'Yasin', 'Yousuf', 'Yatin', 'Yuval',
  'Zain', 'Zahir', 'Zimmerman', 'Zeke', 'Zephyr',
];

// ─── Helper: Generate random coordinates within radius ────────────────────────
/**
 * Generate a random coordinate at a specific distance from center.
 * 
 * @param {number} distanceKm - Distance in km
 * @param {number} centerLng - Center longitude
 * @param {number} centerLat - Center latitude
 * @returns {{ lng: number, lat: number }}
 */
function generateCoordinateAtDistance(distanceKm, centerLng, centerLat) {
  // Random bearing (0-360 degrees)
  const bearing = Math.random() * 360;
  const bearingRad = (bearing * Math.PI) / 180;

  // Earth radius in km
  const earthRadiusKm = 6371;

  // Convert center to radians
  const lat1Rad = (centerLat * Math.PI) / 180;
  const lng1Rad = (centerLng * Math.PI) / 180;

  // Angular distance
  const angularDistance = distanceKm / earthRadiusKm;

  // Calculate new latitude
  const lat2Rad = Math.asin(
    Math.sin(lat1Rad) * Math.cos(angularDistance) +
    Math.cos(lat1Rad) * Math.sin(angularDistance) * Math.cos(bearingRad)
  );

  // Calculate new longitude
  const lng2Rad =
    lng1Rad +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1Rad),
      Math.cos(angularDistance) - Math.sin(lat1Rad) * Math.sin(lat2Rad)
    );

  // Convert back to degrees
  const lat2 = (lat2Rad * 180) / Math.PI;
  const lng2 = (lng2Rad * 180) / Math.PI;

  return { lng: lng2, lat: lat2 };
}

// ─── Main Seed Function ────────────────────────────────────────────────────────
async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  try {
    // ── Configure DNS servers
    const dnsServers = (process.env.MONGO_DNS_SERVERS || '8.8.8.8,1.1.1.1').split(',');
    dns.setServers(dnsServers);
    console.log(`📡 DNS servers configured: ${dnsServers.join(', ')}`);

    // ── Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_FALLBACK;
    if (!mongoUri) {
      throw new Error('MongoDB connection string not found in .env');
    }

    console.log('📡 Connecting to MongoDB...');
    
    // Try SRV first
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
      });
      console.log('✅ Connected via SRV\n');
    } catch (srvError) {
      if (srvError.message.includes('querySrv ECONNREFUSED')) {
        console.log('⚠️  SRV DNS failed, trying fallback non-SRV URI...');
        const fallbackUri = process.env.MONGO_URI_FALLBACK;
        if (!fallbackUri) throw new Error('No fallback URI configured');
        
        await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          family: 4,
        });
        console.log('✅ Connected via fallback non-SRV\n');
      } else {
        throw srvError;
      }
    }

    // ── Clear existing data
    console.log('🗑️  Clearing existing users and issues...');
    await User.deleteMany({});
    await Issue.deleteMany({});
    console.log('✅ Cleared existing data\n');

    // ── Generate users
    console.log('👥 Generating 50 test users...');
    const users = [];
    const hashedPassword = await bcrypt.hash('Geeks@12345', 12);

    // Slice first 50 names from array
    const selectedNames = INDIAN_FIRST_NAMES.slice(0, 50);

    // Generate 30 users within 10km
    for (let i = 0; i < 30; i++) {
      const distanceKm = Math.random() * 10; // 0-10km
      const { lng, lat } = generateCoordinateAtDistance(distanceKm, CENTER_LNG, CENTER_LAT);

      const firstName = selectedNames[i];
      users.push({
        name: firstName,
        email: `${firstName.toLowerCase()}123@test.com`,
        password: hashedPassword,
        role: 'citizen',
        isActive: true,
        isVerified: true,
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        credibilityScore: 0,
        verificationCount: 0,
      });
    }

    // Generate 20 users between 20-50km
    for (let i = 0; i < 20; i++) {
      const distanceKm = 20 + Math.random() * 30; // 20-50km
      const { lng, lat } = generateCoordinateAtDistance(distanceKm, CENTER_LNG, CENTER_LAT);

      const firstName = selectedNames[30 + i];
      users.push({
        name: firstName,
        email: `${firstName.toLowerCase()}123@test.com`,
        password: hashedPassword,
        role: 'citizen',
        isActive: true,
        isVerified: true,
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        credibilityScore: 0,
        verificationCount: 0,
      });
    }

    // Insert users into database
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users\n`);

    // ── Create test issue at center location
    console.log('🎯 Creating test issue at center location...');
    const testIssue = await Issue.create({
      title: 'Test Issue - Pothole on Center Street',
      description:
        'This is a test issue created at the center coordinate for verification testing.',
      category: 'road',
      location: {
        type: 'Point',
        coordinates: [CENTER_LNG, CENTER_LAT],
        address: 'Center Test Location',
        city: 'Ahmedabad',
        ward: 'Test Ward',
      },
      image: { url: '', publicId: '' },
      images: [],
      seriousnessRatings: [3],
      averageSeverity: 3,
      createdBy: createdUsers[0]._id, // Use first user as creator
      status: 'Pending',
    });
    console.log(`✅ Created test issue: ${testIssue._id}\n`);

    // ── Calculate statistics
    console.log('📊 Verification Statistics:\n');
    console.log(`   Total Users Created: ${createdUsers.length}`);
    console.log(`   Users within 10km:  30`);
    console.log(`   Users 20-50km away: 20`);
    console.log(`   Test Issue ID:      ${testIssue._id}`);
    console.log(`   Center Coordinates: [${CENTER_LNG}, ${CENTER_LAT}]\n`);

    // ── Verify counts with geospatial query
    const radiusInRadians = 10 / 6378.1;
    const usersWithin10km = await User.countDocuments({
      location: {
        $geoWithin: {
          $centerSphere: [[CENTER_LNG, CENTER_LAT], radiusInRadians],
        },
      },
    });

    console.log('🔍 Geospatial Query Verification:\n');
    console.log(`   Users within 10km (via geospatial query): ${usersWithin10km}`);
    console.log(`   Users outside 10km: ${createdUsers.length - usersWithin10km}\n`);

    // ── Display sample users
    console.log('📋 Sample Users Created:\n');
    const sampleUsers = createdUsers.slice(0, 3);
    sampleUsers.forEach((user, idx) => {
      console.log(`   ${idx + 1}. ${user.name}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Role: ${user.role}`);
      console.log(`      Location: [${user.location.coordinates[0].toFixed(4)}, ${user.location.coordinates[1].toFixed(4)}]`);
      console.log();
    });

    console.log('✨ Seed completed successfully!\n');

    // ── Exit process
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ─── Run Seed ──────────────────────────────────────────────────────────────────
seedDatabase();
