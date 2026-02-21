/**
 * Standalone seed data generator - no DB required
 * Demonstrates geolocation algorithm and test data generation
 */

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

// Generate random coordinate within radius using haversine formula
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

// Calculate distance between two coordinates
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

console.log('[SEED] Starting standalone seed data generation...');
console.log(`[SEED] Center: [${CENTER_LNG}, ${CENTER_LAT}]`);
console.log(`[SEED] Radius: ${MAX_RADIUS_KM}km`);
console.log(`[SEED] Password: ${PASSWORD}\n`);

// Generate users
// To ensure nearby notification feature works, create 2 users within 2km and 3 beyond
const users = [];
console.log('[SEED] Generating 5 users within 10km radius...');
console.log('[SEED] Strategy: 2 users within 2km (for nearby notification), 3 beyond\n');

for (let i = 0; i < 5; i++) {
  const name = INDIAN_NAMES[i];
  const email = `${name.toLowerCase()}123@test.com`;
  
  // First 2 users within 2km (will get notified of issues)
  // Remaining 3 users beyond 2km but within 10km
  const radiusLimit = i < 2 ? 2.0 : MAX_RADIUS_KM;
  const [lng, lat] = generateRandomCoordinate(CENTER_LNG, CENTER_LAT, radiusLimit);
  const distanceKm = calculateDistance(CENTER_LAT, CENTER_LNG, lat, lng);

  users.push({
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
    distanceFromCenter: distanceKm,
  });

  console.log(
    `  [${i + 1}] ${name} - Email: ${email} - Coords: [${lng.toFixed(4)}, ${lat.toFixed(4)}] - Distance: ${distanceKm.toFixed(2)}km`
  );
}

// Check how many are within 2km
const nearbyUsers = users.filter((u) => u.distanceFromCenter <= 2.0);

console.log(`\n[SEED] Generated 5 users.`);
console.log(`[SEED] Users within 2km (nearby): ${nearbyUsers.length}`);

// Issue at center
const issue = {
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
  status: 'Pending',
  createdById: `<user_id:${users[0].name}>`,
};

// Print results
console.log('\n═══════════════════════════════════════════════════════════');
console.log('[RESULTS]');
console.log('═══════════════════════════════════════════════════════════');
console.log(`Total users created: ${users.length}`);
console.log(`Issue created at: [${CENTER_LNG}, ${CENTER_LAT}]`);
console.log(`Users within 2km of issue: ${nearbyUsers.length}`);

console.log('\n✓ Created Users:');
users.forEach((user, idx) => {
  const [lng, lat] = user.location.coordinates;
  console.log(
    `  ${idx + 1}. ${user.name.padEnd(10)} (${user.email}) - [${lng.toFixed(4)}, ${lat.toFixed(4)}] - ${user.distanceFromCenter.toFixed(2)}km`
  );
});

if (nearbyUsers.length > 0) {
  console.log('\n✓ Users within 2km of issue:');
  nearbyUsers.forEach((user, idx) => {
    const [lng, lat] = user.location.coordinates;
    console.log(
      `  ${idx + 1}. ${user.name.padEnd(10)} (${user.email}) - [${lng.toFixed(4)}, ${lat.toFixed(4)}] - ${user.distanceFromCenter.toFixed(2)}km`
    );
  });
} else {
  console.log('\n✓ No users within 2km of issue');
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('[DATABASE OPERATIONS]');
console.log('═══════════════════════════════════════════════════════════');
console.log('To populate database, run in MongoDB:');
console.log(`
1. Clear existing:
   db.users.deleteMany({})
   db.issues.deleteMany({})

2. Insert users:
   db.users.insertMany([
${users
  .map(
    (u) => `     {
       name: "${u.name}",
       email: "${u.email}",
       password: "<bcrypt_hash_of_${PASSWORD}>",
       role: "${u.role}",
       isVerified: ${u.isVerified},
       isActive: ${u.isActive},
       location: {
         type: "Point",
         coordinates: [${u.location.coordinates[0].toFixed(4)}, ${u.location.coordinates[1].toFixed(4)}]
       },
       credibilityScore: ${u.credibilityScore},
       verificationCount: ${u.verificationCount},
       locationName: "${u.locationName}"
     }`
  )
  .join(',\n')}
   ])

3. Get user IDs and insert issue:
   db.issues.insertOne({
     title: "${issue.title}",
     description: "${issue.description}",
     category: "${issue.category}",
     location: {
       type: "Point",
       coordinates: [${issue.location.coordinates[0]}, ${issue.location.coordinates[1]}],
       address: "${issue.location.address}",
       city: "${issue.location.city}",
       ward: "${issue.location.ward}"
     },
     status: "${issue.status}",
     createdBy: ObjectId("<first_user_id>")
   })

4. Test nearby query:
   db.users.find({
     location: {
       $near: {
         $geometry: {
           type: "Point",
           coordinates: [${CENTER_LNG}, ${CENTER_LAT}]
         },
         $maxDistance: 2000
       }
     },
     isActive: true
   })
`);

console.log('═══════════════════════════════════════════════════════════\n');

console.log(`[SUCCESS] Test data generation complete.`);
console.log(`[INFO] Geolocation algorithm used: Haversine formula`);
console.log(`[INFO] Earth radius: 6371 km`);
console.log(`[INFO] Random bearing: 0 to 2π`);
console.log(`[INFO] Random distance: 0 to ${MAX_RADIUS_KM} km`);

process.exit(0);
