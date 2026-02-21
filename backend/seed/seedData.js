/**
 * ╔══════════════════════════════════════════════════════╗
 * ║       CivicPulse – Realistic Indian Seed Data        ║
 * ║  50 users (45 Pune ≤10 km · 5 other cities)         ║
 * ║  29 civic issues with real images                    ║
 * ╚══════════════════════════════════════════════════════╝
 *
 *  Run:  node seed/seedData.js
 *  Env:  MONGO_URI must be set in backend/.env
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const Issue    = require('../models/Issue');

// ── helpers ──────────────────────────────────────────────────────────────────
/** uniform random float in [min, max] */
const rand = (min, max) => Math.random() * (max - min) + min;

/** random integer in [min, max] inclusive */
const randInt = (min, max) => Math.floor(rand(min, max + 1));

/** pick a random element from an array */
const pick = (arr) => arr[randInt(0, arr.length - 1)];

/**
 * Return [lng, lat] uniformly distributed inside a circle of `radiusKm`
 * centred on [cLng, cLat].
 */
function randomPointInRadius(cLng, cLat, radiusKm) {
  const radiusDeg = radiusKm / 111.32;          // rough deg-per-km
  const angle     = Math.random() * 2 * Math.PI;
  const r         = Math.sqrt(Math.random()) * radiusDeg; // uniform area
  return [
    parseFloat((cLng + r * Math.cos(angle)).toFixed(6)),
    parseFloat((cLat + r * Math.sin(angle)).toFixed(6)),
  ];
}

// ── constants ─────────────────────────────────────────────────────────────────
const PUNE_CENTER = { lng: 73.8567, lat: 18.5204 };

const PUNE_AREAS = [
  { name: 'Koregaon Park',       ward: 'Ward 8'  },
  { name: 'Viman Nagar',         ward: 'Ward 12' },
  { name: 'Baner',               ward: 'Ward 15' },
  { name: 'Kothrud',             ward: 'Ward 7'  },
  { name: 'Hadapsar',            ward: 'Ward 20' },
  { name: 'Shivajinagar',        ward: 'Ward 3'  },
  { name: 'Deccan Gymkhana',     ward: 'Ward 4'  },
  { name: 'Kalyani Nagar',       ward: 'Ward 11' },
  { name: 'Wakad',               ward: 'Ward 16' },
  { name: 'Aundh',               ward: 'Ward 14' },
  { name: 'Pimple Saudagar',     ward: 'Ward 17' },
  { name: 'Chinchwad',           ward: 'Ward 22' },
  { name: 'Kharadi',             ward: 'Ward 13' },
  { name: 'Magarpatta City',     ward: 'Ward 19' },
  { name: 'Sadashiv Peth',       ward: 'Ward 5'  },
  { name: 'FC Road',             ward: 'Ward 4'  },
  { name: 'Swargate',            ward: 'Ward 6'  },
  { name: 'Kondhwa',             ward: 'Ward 21' },
  { name: 'Katraj',              ward: 'Ward 23' },
  { name: 'Camp Area',           ward: 'Ward 9'  },
  { name: 'Pashan',              ward: 'Ward 15' },
  { name: 'Wanowrie',            ward: 'Ward 18' },
  { name: 'Dhanori',             ward: 'Ward 10' },
  { name: 'Bibwewadi',           ward: 'Ward 24' },
  { name: 'Yerawada',            ward: 'Ward 2'  },
];

const OTHER_CITIES = [
  { name: 'Andheri West, Mumbai',     city: 'Mumbai',    coord: [72.8366, 19.1197] },
  { name: 'Connaught Place, Delhi',   city: 'Delhi',     coord: [77.2090, 28.6320] },
  { name: 'Koramangala, Bengaluru',   city: 'Bengaluru', coord: [77.6245, 12.9352] },
  { name: 'T. Nagar, Chennai',        city: 'Chennai',   coord: [80.2340, 13.0418] },
  { name: 'Banjara Hills, Hyderabad', city: 'Hyderabad', coord: [78.4483, 17.4139] },
];

// ── Real Indian names ─────────────────────────────────────────────────────────
const INDIAN_MALE_NAMES = [
  'Aarav Sharma','Vivaan Patel','Aditya Mehta','Vihaan Joshi','Arjun Desai',
  'Sai Kulkarni','Reyansh Gupta','Ayaan Khan','Krishna Nair','Ishaan Reddy',
  'Shaurya Verma','Atharv Singh','Parth Sawant','Dhruv Chavan','Kabir Bose',
  'Rian Malhotra','Arnav Kapoor','Yash Iyer','Advait Pandey','Kartik Rao',
  'Rohan Jain','Manav Tiwari','Daksh Agarwal','Virat Bhatt','Tejas Shetty',
  'Omkar Naik','Harsh Thakur','Nikhil Subramaniam','Pranav Hegde','Sumit Das',
];

const INDIAN_FEMALE_NAMES = [
  'Aadhya Sharma','Ananya Patel','Diya Joshi','Saanvi Mehta','Pari Nair',
  'Shriya Reddy','Aanya Singh','Riya Gupta','Kavya Iyer','Nisha Kulkarni',
  'Ishita Desai','Anvi Verma','Pooja Chavan','Sneha Sawant','Mira Kapoor',
  'Priya Rao','Divya Pandey','Neha Tiwari','Isha Malhotra','Kritika Jain',
];

// ── Real Indian portrait photos from Unsplash (stable CDN URLs) ──────────────
// All photos are of actual Indian people (verified Unsplash IDs)
const MALE_AVATARS = [
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=200&h=200&fit=crop&crop=face&auto=format',
];

const FEMALE_AVATARS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=200&h=200&fit=crop&crop=face&auto=format',
  'https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=200&h=200&fit=crop&crop=face&auto=format',
];

// ── Civic issue images from Unsplash (real, non-stock-looking photos) ─────────
const ISSUE_IMAGES = {
  road: [
    { url: 'https://images.unsplash.com/photo-1603804875516-b57a9f574a0a?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/road_pothole_01' },
    { url: 'https://images.unsplash.com/photo-1597149017284-d11b0e7bc9c7?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/road_construction_01' },
    { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/road_pothole_02' },
    { url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/road_damage_01' },
  ],
  water: [
    { url: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/water_flood_01' },
    { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/water_overflow_01' },
    { url: 'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/water_drain_01' },
  ],
  sanitation: [
    { url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/sanitation_garbage_01' },
    { url: 'https://images.unsplash.com/photo-1590159983013-d4de8c5d2b20?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/sanitation_waste_01' },
    { url: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/sanitation_garbage_02' },
  ],
  electricity: [
    { url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/electricity_street_01' },
    { url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/electricity_wire_01' },
  ],
  safety: [
    { url: 'https://images.unsplash.com/photo-1516475429486-395a5c3b5b91?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/safety_traffic_01' },
    { url: 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/safety_pollution_01' },
  ],
  environment: [
    { url: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/env_tree_01' },
    { url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/env_pollution_01' },
    { url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/env_waste_01' },
  ],
  infrastructure: [
    { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/infra_construction_01' },
    { url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/infra_bridge_01' },
  ],
  other: [
    { url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=900&auto=format&fit=crop&q=80', publicId: 'civicpulse/issues/other_street_01' },
  ],
};

// ── 29 realistic civic issue templates ───────────────────────────────────────
const ISSUE_TEMPLATES = [
  // ROAD (7)
  {
    category: 'road',
    title: 'Deep pothole near Koregaon Park signal causing accidents',
    description: 'There is a massive pothole at the main Koregaon Park signal junction, approximately 2 feet deep and 3 feet wide. Two scooters have already fallen due to this. The pothole has been there for over 3 weeks now and no one from PMC has come to fix it. Vehicles are swerving dangerously trying to avoid it, especially at night when visibility is low. Requesting urgent repair before a major accident occurs.',
    area: 'Koregaon Park', ward: 'Ward 8', status: 'Verified', verificationCount: 8,
    seriousnessRatings: [4, 5, 4, 3, 5, 4, 4, 5], averageSeverity: 4.25,
  },
  {
    category: 'road',
    title: 'Road completely dug up on Baner-Balewadi highway, no safety barriers',
    description: 'PMC contractors have dug up the entire stretch of road from Baner chowk to Balewadi petrol pump for pipeline laying. The work has been stalled for 10 days and there are NO proper barricades or caution lights. Last night at around 9 PM a cyclist fell into one of the trenches. The contractors left without putting any fencing. This is extremely dangerous especially for two-wheelers.',
    area: 'Baner', ward: 'Ward 15', status: 'Critical', verificationCount: 15,
    seriousnessRatings: [5, 5, 4, 5, 4, 5, 5, 5, 4, 5], averageSeverity: 4.7,
  },
  {
    category: 'road',
    title: 'Pimple Saudagar service road completely broken after monsoon',
    description: 'The service road running parallel to the Mumbai-Pune highway in Pimple Saudagar is in terrible condition after the monsoon. What were once small potholes have now become craters. The road is practically undriveable and daily commuters are suffering. Heavy vehicles from the nearby industrial area make it worse by the day. PMC response to multiple complaints has been zero.',
    area: 'Pimple Saudagar', ward: 'Ward 17', status: 'Pending', verificationCount: 3,
    seriousnessRatings: [3, 4, 3], averageSeverity: 3.33,
  },
  {
    category: 'road',
    title: 'Broken footpath tiles injuring pedestrians on FC Road',
    description: 'The newly-built footpath on FC Road near Maratha Mandir hotel has broken tiles sticking up at dangerous angles. Two elderly people have already tripped and got hurt this week. This footpath was supposedly renovated just 4 months ago under Smart City project but the quality of material used is clearly substandard. PMC should take action against the contractor.',
    area: 'FC Road', ward: 'Ward 4', status: 'Pending', verificationCount: 2,
    seriousnessRatings: [3, 4], averageSeverity: 3.5,
  },
  {
    category: 'road',
    title: 'Speed breaker markings completely faded on Kharadi bypass, accidents happening',
    description: 'The speed breaker near Kharadi bypass IT park entrance has no visible markings whatsoever. The yellow paint has completely faded. Vehicles coming at high speed do not notice it until they hit it. The road is also poorly lit at that stretch. We have seen 3 accidents in the last month because of this. Requesting immediate repainting of road markings.',
    area: 'Kharadi', ward: 'Ward 13', status: 'Pending', verificationCount: 4,
    seriousnessRatings: [4, 4, 3, 4], averageSeverity: 3.75,
  },
  {
    category: 'road',
    title: 'Illegal encroachment on Sadashiv Peth road narrowing to one lane',
    description: 'A shop owner on Sadashiv Peth main road has permanently placed goods and wooden planks on the road itself, effectively reducing a two-lane road to one lane. This creates massive traffic jams every morning from 8–10 AM. PMC officials have reportedly been told about this multiple times but no action is taken. Traffic police is also inactive on this.',
    area: 'Sadashiv Peth', ward: 'Ward 5', status: 'Pending', verificationCount: 1,
    seriousnessRatings: [3], averageSeverity: 3,
  },
  {
    category: 'road',
    title: 'Overflowing nullah damaging Camp Area road foundation',
    description: 'The nullah at Camp Area near Queen\'s Garden has been overflowing for 3 days and the water is seeping under the road causing it to sink at one spot. If left unattended, the road could cave in within days. This section is used by heavy army vehicles as well. Urgent desilting of the nullah and road foundation repair needed immediately.',
    area: 'Camp Area', ward: 'Ward 9', status: 'Verified', verificationCount: 6,
    seriousnessRatings: [4, 5, 4, 4, 3, 4], averageSeverity: 4,
  },

  // WATER (5)
  {
    category: 'water',
    title: 'Water supply cut for 4 days in Hadapsar — no response from PCMC',
    description: 'Our entire sector of Hadapsar has had no water supply for the past 4 consecutive days. The tankers promised by the municipal corporation came only once and that too charged ₹800 per trip. Families with elderly members and children are struggling. We have called the helpline 1800-120-0030 multiple times but nobody answers. When will this be resolved?',
    area: 'Hadapsar', ward: 'Ward 20', status: 'Critical', verificationCount: 14,
    seriousnessRatings: [5, 5, 5, 4, 5, 5, 5, 4, 5, 5], averageSeverity: 4.8,
  },
  {
    category: 'water',
    title: 'Burst water pipeline causing waterlogging on Wakad main road',
    description: 'The main water supply pipeline running beneath Wakad chowk has burst and water has been gushing since yesterday afternoon. The road has turned into a small lake. Cars are getting stuck and pedestrians are wading through knee-deep water. The nearby apartments are also getting water seepage in their basements. PMC water works team has been informed but hasn\'t arrived yet.',
    area: 'Wakad', ward: 'Ward 16', status: 'Verified', verificationCount: 9,
    seriousnessRatings: [5, 4, 5, 5, 4, 5, 4, 5, 4], averageSeverity: 4.56,
  },
  {
    category: 'water',
    title: 'Sewage water mixing with drinking water in Kondhwa residential area',
    description: 'Residents of Kondhwa sector 15 have been getting brown/yellowish water from taps since last week. The smell is clearly that of sewage. Several residents have fallen ill with stomach infections. We tested the water locally and found it is contaminated. The sewage line is apparently broken and running alongside the drinking water line in this area. This is a serious health hazard.',
    area: 'Kondhwa', ward: 'Ward 21', status: 'Critical', verificationCount: 18,
    seriousnessRatings: [5, 5, 5, 5, 5, 5, 4, 5, 5, 5], averageSeverity: 4.9,
  },
  {
    category: 'water',
    title: 'Open overflow from broken manhole flooding Yerawada street',
    description: 'The manhole cover on the street near Yerawada police station has broken and raw sewage is flowing freely on to the road. The smell is unbearable and children going to the nearby school have to pass through this. This is a serious health and hygiene hazard. Mosquito breeding is already visible. Immediate sealing of the manhole and cleaning of road required.',
    area: 'Yerawada', ward: 'Ward 2', status: 'Verified', verificationCount: 7,
    seriousnessRatings: [5, 5, 5, 4, 4, 5, 5], averageSeverity: 4.71,
  },
  {
    category: 'water',
    title: 'Low water pressure in Kalyani Nagar sector 3 for 2 weeks',
    description: 'For the past two weeks, water pressure in Kalyani Nagar sector 3 is extremely low. Water comes for only 30–40 minutes in the morning and barely fills one bucket. The apartments on upper floors (3rd and above) get no water at all and have to carry it from downstairs. This started after some pipeline work was done in the adjacent road. Needs urgent inspection.',
    area: 'Kalyani Nagar', ward: 'Ward 11', status: 'Pending', verificationCount: 3,
    seriousnessRatings: [3, 4, 3], averageSeverity: 3.33,
  },

  // SANITATION (4)
  {
    category: 'sanitation',
    title: 'Garbage not collected for 8 days near Deccan Gymkhana circle',
    description: 'The PMC garbage van has not visited our ward near Deccan Gymkhana for 8 straight days. The overflowing garbage bin near the footpath is attracting stray dogs and crows. The rotting organic waste smell is unbearable in the summer heat. Multiple complaints to the ward office on 020-25501191 have gone unanswered. Children walk by this spot daily to reach school.',
    area: 'Deccan Gymkhana', ward: 'Ward 4', status: 'Verified', verificationCount: 9,
    seriousnessRatings: [4, 4, 5, 4, 4, 3, 4, 5, 4], averageSeverity: 4.11,
  },
  {
    category: 'sanitation',
    title: 'Illegal dumping ground created on Katraj bypass open plot',
    description: 'A vacant PMC plot near Katraj bypass has been illegally converted into a garbage dump by residents of nearby chawls. Construction debris, household waste and plastic is being dumped here openly. The plot is next to a school and the garbage burning at night creates toxic smoke that enters classrooms. This has been happening for 3 months.',
    area: 'Katraj', ward: 'Ward 23', status: 'Pending', verificationCount: 2,
    seriousnessRatings: [4, 5], averageSeverity: 4.5,
  },
  {
    category: 'sanitation',
    title: 'Public toilet in Swargate bus stand in extremely poor condition',
    description: 'The public toilet adjacent to Swargate bus stand is in a shamefully bad condition. There is no running water, the doors are broken, and the floor is covered in filth. Hundreds of passengers use this facility daily. The PMC has a maintenance contract for this toilet but they are clearly not fulfilling it. Female passengers especially face severe discomfort.',
    area: 'Swargate', ward: 'Ward 6', status: 'Pending', verificationCount: 4,
    seriousnessRatings: [4, 5, 4, 4], averageSeverity: 4.25,
  },
  {
    category: 'sanitation',
    title: 'Dhanori nullah emitting poisonous fumes due to industrial waste dumping',
    description: 'Industries in the MIDC area near Dhanori are illegally dumping chemical waste into the nullah at night. The next morning residents can smell a foul chemical odour. Several people have reported eye irritation and breathing difficulty. The colour of the nullah water changes to dark blue/black on some mornings. This has been going on for months and is a serious environmental and health concern.',
    area: 'Dhanori', ward: 'Ward 10', status: 'Critical', verificationCount: 12,
    seriousnessRatings: [5, 5, 5, 5, 4, 5, 4, 5, 5, 5], averageSeverity: 4.8,
  },

  // ELECTRICITY (3)
  {
    category: 'electricity',
    title: 'Streetlights not working for entire Pashan Lake road stretch',
    description: 'The full 1.5 km stretch of Pashan Lake road has had no functional streetlights for the past 3 weeks. At least 6 sodium lamp posts are dark. The road is used heavily by IT workers returning from offices at night and by joggers early morning. Two chain snatching incidents happened in this dark stretch last week. MSEDCL complaint registered on 19000 but no action.',
    area: 'Pashan', ward: 'Ward 15', status: 'Verified', verificationCount: 7,
    seriousnessRatings: [4, 5, 4, 4, 3, 4, 4], averageSeverity: 4,
  },
  {
    category: 'electricity',
    title: 'Dangerous live electric wire hanging low on Wanowrie road',
    description: 'A high-tension electric wire has snapped and is hanging extremely low across the road in Wanowrie near the new housing society. The wire is barely 7 feet from the ground. Any tall vehicle like a truck or bus can touch it and cause electrocution. The wire appeared to have partially snapped during last night\'s storm. This is a life-threatening emergency. MSEDCL has been called but not yet responded.',
    area: 'Wanowrie', ward: 'Ward 18', status: 'Critical', verificationCount: 22,
    seriousnessRatings: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5], averageSeverity: 5,
  },
  {
    category: 'electricity',
    title: 'Frequent power cuts in Bibwewadi — 6–8 hours daily',
    description: 'Bibwewadi residential area is facing scheduled and unscheduled power cuts adding up to 6–8 hours per day for the last 2 weeks. Small businesses, home-based workers and students preparing for exams are severely impacted. MSEDCL says the local transformer is overloaded but have done nothing to add capacity. Summer has just started and this will only get worse.',
    area: 'Bibwewadi', ward: 'Ward 24', status: 'Verified', verificationCount: 5,
    seriousnessRatings: [4, 3, 4, 4, 3], averageSeverity: 3.6,
  },

  // SAFETY (3)
  {
    category: 'safety',
    title: 'No traffic signal at busy Aundh ITI junction causing daily accidents',
    description: 'The Aundh ITI junction sees traffic from 4 directions including a school, a market, and two residential colonies. Despite multiple requests and accidents, there is NO traffic signal here. The police booth nearby is usually unmanned. There have been 2 major accident cases in the last month. Parents are afraid to let children walk to school. An immediate temporary signal or police deployment is required.',
    area: 'Aundh', ward: 'Ward 14', status: 'Verified', verificationCount: 11,
    seriousnessRatings: [5, 5, 4, 4, 5, 5, 4, 4, 5, 4], averageSeverity: 4.5,
  },
  {
    category: 'safety',
    title: 'Open construction pit unfenced on Viman Nagar road — child fell in',
    description: 'Developers constructing a new commercial building in Viman Nagar have left a deep excavation pit completely open and unfenced on the roadside. Yesterday evening a 10-year-old child fell into it and thankfully was rescued quickly with only minor injuries. The company has put no hoarding, no light, no barrier. This is right on the footpath used by school children and evening walkers.',
    area: 'Viman Nagar', ward: 'Ward 12', status: 'Critical', verificationCount: 16,
    seriousnessRatings: [5, 5, 5, 5, 5, 4, 5, 5, 4, 5], averageSeverity: 4.8,
  },
  {
    category: 'safety',
    title: 'Stray dogs attacking pedestrians near Magarpatta City gate 3',
    description: 'A pack of about 10–12 stray dogs has made the area outside Magarpatta City gate 3 their territory. They have attacked 4 people in the last 2 weeks, including a delivery boy who was bitten on the leg. Morning walkers are too scared to use this stretch. The PMC dogcatcher team has been called multiple times but hasn\'t shown up. Sterilisation or relocation required immediately.',
    area: 'Magarpatta City', ward: 'Ward 19', status: 'Pending', verificationCount: 4,
    seriousnessRatings: [4, 5, 4, 5], averageSeverity: 4.5,
  },

  // ENVIRONMENT (4)
  {
    category: 'environment',
    title: 'Large tree uprooted blocking Shivajinagar lane, power lines at risk',
    description: 'A 30-year-old tree near the Shivajinagar court building has been uprooted by strong winds and has fallen across the lane completely blocking it. One of the power lines above is slightly bent but not yet snapped. The tree is very large and needs immediate heavy machinery. The lane connects to the court and emergency vehicles may need access. PMC tree cell informed, awaiting response.',
    area: 'Shivajinagar', ward: 'Ward 3', status: 'Resolved',
    verificationCount: 9, resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    seriousnessRatings: [4, 5, 4, 4, 5, 4, 4, 5, 4], averageSeverity: 4.33,
  },
  {
    category: 'environment',
    title: 'Garbage burning near Kothrud society causing severe air pollution',
    description: 'The dry waste from approximately 15 nearby housing societies is being dumped and set on fire daily in a plot near Kothrud depot. The smoke covers the entire neighbourhood from 6 PM to 9 PM every evening. Several residents have complained of throat irritation and eye problems. Burning garbage is illegal under PMC norms. The plot belongs to a builder who is ignoring all complaints.',
    area: 'Kothrud', ward: 'Ward 7', status: 'Pending', verificationCount: 3,
    seriousnessRatings: [4, 4, 3], averageSeverity: 3.67,
  },
  {
    category: 'environment',
    title: 'Nilgiris tree saplings planted under Smart City scheme all dead',
    description: 'Under the Smart City plantation drive, 80 saplings were planted along the footpath of Chinchwad road with great fanfare last month. Today 70% of them are dead because nobody is watering them. The PMC did not assign any responsibility for maintenance. The remaining ones are also drying up fast. This is misuse of public funds and needs immediate corrective action.',
    area: 'Chinchwad', ward: 'Ward 22', status: 'Pending', verificationCount: 2,
    seriousnessRatings: [3, 3], averageSeverity: 3,
  },
  {
    category: 'environment',
    title: 'Factory near Bibwewadi discharging black smoke without check',
    description: 'A chemical factory situated in the industrial zone near Bibwewadi is openly discharging thick black smoke from its chimney 24×7 without any scrubbers. The entire neighbourhood smells of sulphur. Clothes dried on terraces turn grey. Residents report frequent headaches. The Maharashtra Pollution Control Board has been complained to twice but factory continues running unchecked.',
    area: 'Bibwewadi', ward: 'Ward 24', status: 'Pending', verificationCount: 1,
    seriousnessRatings: [4], averageSeverity: 4,
  },

  // INFRASTRUCTURE (3)
  {
    category: 'infrastructure',
    title: 'Old pedestrian bridge at Kharadi creek in crumbling condition',
    description: 'The old pedestrian bridge over the Kharadi creek used by hundreds of students and factory workers daily has large cracks in its support pillars. Cement is visibly peeling off and exposing rusted iron rods. The bridge was built in the 1980s and has never seen major repair. A structural engineer we consulted informally said it could be dangerous. Requesting immediate structural audit from PMC.',
    area: 'Kharadi', ward: 'Ward 13', status: 'Verified', verificationCount: 8,
    seriousnessRatings: [5, 5, 4, 5, 4, 5, 4, 5], averageSeverity: 4.63,
  },
  {
    category: 'infrastructure',
    title: 'Crumbling compound wall of public school in Kondhwa posing danger',
    description: 'The boundary wall of the Zilla Parishad school in Kondhwa sector 7 is about to collapse. Large portions have already fallen after the monsoon rains. Students pass very close to this wall daily. Teachers have written multiple letters to the education department but no repair work has been sanctioned. If the wall falls during school hours, children could be seriously hurt.',
    area: 'Kondhwa', ward: 'Ward 21', status: 'Critical', verificationCount: 13,
    seriousnessRatings: [5, 5, 5, 5, 4, 5, 5, 5, 4, 5], averageSeverity: 4.8,
  },
  {
    category: 'infrastructure',
    title: 'Bus stop shelter completely destroyed in Hadapsar Gadital area',
    description: 'The PMPML bus stop shelter at Hadapsar Gadital has been completely destroyed — the roof is gone, seats are broken and it offers no protection whatsoever. Hundreds of daily commuters, including elderly and school children, stand in the sun and rain waiting for buses. This stop handles at least 15 bus routes. The shelter was vandalized 6 months ago and has not been repaired since.',
    area: 'Hadapsar', ward: 'Ward 20', status: 'Pending', verificationCount: 3,
    seriousnessRatings: [3, 4, 3], averageSeverity: 3.33,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN SEED FUNCTION
// ══════════════════════════════════════════════════════════════════════════════
async function seed() {
  console.log('\n🌱  CivicPulse Seed Script');
  console.log('══════════════════════════════════════════════\n');

  // ── 1. Connect ─────────────────────────────────────────────────────────────
  console.log('📡  Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 5,
  });
  console.log(`✅  Connected to: ${mongoose.connection.host}\n`);

  // ── 2. Clear previous seed data ───────────────────────────────────────────
  console.log('🗑️   Clearing existing seeded data...');
  await Issue.deleteMany({});
  await User.deleteMany({ role: { $ne: 'admin' } }); // keep admins if any
  console.log('✅  Cleared issues and non-admin users\n');

  // ── 3. Fetch real Indian people photos from randomuser.me ─────────────────
  console.log('📸  Fetching real Indian profile photos from randomuser.me...');
  let apiProfiles = [];
  try {
    const res  = await fetch('https://randomuser.me/api/?nat=in&results=55&noinfo');
    const data = await res.json();
    apiProfiles = data.results;
    console.log(`✅  Fetched ${apiProfiles.length} Indian profiles from API\n`);
  } catch (e) {
    console.warn('⚠️   randomuser.me unavailable, using fallback Unsplash avatars\n');
  }

  // ── 4. Build user documents ───────────────────────────────────────────────
  console.log('👤  Building 50 user profiles...');
  const SEED_PASSWORD = await bcrypt.hash('Seed@123456', 12);

  const usersToInsert = [];
  let maleIdx = 0, femaleIdx = 0;

  // ── 4a. 45 users inside Pune ≤ 10 km ─────────────────────────────────────
  const indianMaleNames   = [...INDIAN_MALE_NAMES];
  const indianFemaleNames = [...INDIAN_FEMALE_NAMES];
  let totalIdx = 0;

  for (let i = 0; i < 45; i++) {
    totalIdx++;
    const isFemale    = i % 3 === 0;                         // roughly 1/3 female
    const [lng, lat]  = randomPointInRadius(PUNE_CENTER.lng, PUNE_CENTER.lat, 9.5);
    const area        = PUNE_AREAS[i % PUNE_AREAS.length];
    const rawName     = isFemale
      ? indianFemaleNames[femaleIdx++ % indianFemaleNames.length]
      : indianMaleNames[maleIdx++   % indianMaleNames.length];

    // Profile photo: prefer API result, fall back to curated list
    let avatarUrl;
    if (apiProfiles[i]) {
      avatarUrl = apiProfiles[i].picture.large;
    } else {
      avatarUrl = isFemale
        ? FEMALE_AVATARS[femaleIdx % FEMALE_AVATARS.length]
        : MALE_AVATARS[maleIdx % MALE_AVATARS.length];
    }

    const emailHandle = rawName.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
    const roleOptions = ['user', 'citizen', 'citizen', 'official'];
    const role        = i === 0 ? 'official' : pick(roleOptions);

    usersToInsert.push({
      name:     rawName,
      email:    `${emailHandle}.${i + 1}@gmail.com`,
      password: SEED_PASSWORD,
      role,
      avatar: {
        url:      avatarUrl,
        publicId: `civicpulse/avatars/user_pune_${i + 1}`,
      },
      locationName: `${area.name}, Pune`,
      location: {
        type:        'Point',
        coordinates: [lng, lat],
      },
      verificationCount: randInt(0, 18),
      credibilityScore:  randInt(10, 95),
      isVerified: Math.random() > 0.35,
      isActive:   true,
      createdAt:  new Date(Date.now() - randInt(5, 180) * 24 * 60 * 60 * 1000),
    });
  }

  // ── 4b. 5 users from other cities ─────────────────────────────────────────
  for (let j = 0; j < OTHER_CITIES.length; j++) {
    const cityInfo    = OTHER_CITIES[j];
    const isFemale    = j % 2 === 0;
    const rawName     = isFemale
      ? indianFemaleNames[(femaleIdx++) % indianFemaleNames.length]
      : indianMaleNames[(maleIdx++) % indianMaleNames.length];

    let avatarUrl;
    const apiIdx = 45 + j;
    if (apiProfiles[apiIdx]) {
      avatarUrl = apiProfiles[apiIdx].picture.large;
    } else {
      avatarUrl = isFemale
        ? FEMALE_AVATARS[(femaleIdx) % FEMALE_AVATARS.length]
        : MALE_AVATARS[(maleIdx) % MALE_AVATARS.length];
    }

    const emailHandle = rawName.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');

    usersToInsert.push({
      name:     rawName,
      email:    `${emailHandle}.city${j + 1}@outlook.com`,
      password: SEED_PASSWORD,
      role:     'citizen',
      avatar: {
        url:      avatarUrl,
        publicId: `civicpulse/avatars/user_${cityInfo.city.toLowerCase()}_${j + 1}`,
      },
      locationName: cityInfo.name,
      location: {
        type:        'Point',
        coordinates: [cityInfo.coord[0], cityInfo.coord[1]],
      },
      verificationCount: randInt(0, 8),
      credibilityScore:  randInt(5, 70),
      isVerified: Math.random() > 0.5,
      isActive:   true,
      createdAt:  new Date(Date.now() - randInt(10, 90) * 24 * 60 * 60 * 1000),
    });
  }

  // Bulk-insert users (password already hashed — bypass pre-save hook)
  const insertedUsers = await User.insertMany(usersToInsert, { ordered: true });
  console.log(`✅  Inserted ${insertedUsers.length} users\n`);

  // ── 5. Build 29 issue documents ───────────────────────────────────────────
  console.log('📋  Building 29 civic issues...');

  // Only use Pune users to create issues (more realistic)
  const puneUsers = insertedUsers.slice(0, 45);

  const issueDocs = ISSUE_TEMPLATES.map((tpl, idx) => {
    const creator   = puneUsers[idx % puneUsers.length];
    const area      = PUNE_AREAS.find(a => a.name === tpl.area) || PUNE_AREAS[idx % PUNE_AREAS.length];
    const [lng, lat] = randomPointInRadius(PUNE_CENTER.lng, PUNE_CENTER.lat, 9.5);
    const imgList   = ISSUE_IMAGES[tpl.category] || ISSUE_IMAGES.other;
    const mainImg   = imgList[idx % imgList.length];

    // Build 2–4 random verifiers who liked/verified the issue
    const shuffled  = [...puneUsers].sort(() => Math.random() - 0.5);
    const likers    = shuffled.slice(0, randInt(3, 15)).map(u => u._id);

    // A few comments from other users
    const commentAuthors = shuffled.slice(15, 19);
    const commentTexts   = [
      'I saw this issue as well near my house. Please fix this urgently.',
      'This has been here for weeks. PMC is not responding to our calls.',
      'Our building committee already submitted a written complaint but no action yet.',
      'I photographed this yesterday. It is getting worse every day.',
      'My child fell near this spot. This needs immediate attention.',
      'I have been using this road daily for 2 years. Never seen it this bad.',
    ];
    const comments = commentAuthors.map((u, ci) => ({
      user:   u._id,
      text:   commentTexts[ci % commentTexts.length],
      image:  { url: '', publicId: '' },
      createdAt: new Date(Date.now() - randInt(0, 5) * 24 * 60 * 60 * 1000),
    }));

    return {
      title:       tpl.title,
      description: tpl.description,
      category:    tpl.category,
      location: {
        type:        'Point',
        coordinates: [lng, lat],
        address:     `${area.name}, Pune`,
        city:        'Pune',
        ward:        area.ward,
      },
      image:     { url: mainImg.url, publicId: mainImg.publicId },
      images:    [],
      createdBy: creator._id,
      likes:     likers,
      likeCount: likers.length,
      comments,
      commentCount:      comments.length,
      verificationCount: tpl.verificationCount || 0,
      seriousnessRatings: tpl.seriousnessRatings || [],
      averageSeverity:    tpl.averageSeverity    || 0,
      status:       tpl.status || 'Pending',
      resolvedAt:   tpl.resolvedAt || null,
      aiVerification: {
        isVerified:  tpl.status === 'Verified' || tpl.status === 'Critical',
        confidence:  parseFloat((rand(0.72, 0.98)).toFixed(2)),
        tags:        [tpl.category, 'civic-issue', 'pune'],
        processedAt: new Date(Date.now() - randInt(0, 4) * 24 * 60 * 60 * 1000),
      },
      createdAt: new Date(Date.now() - randInt(1, 45) * 24 * 60 * 60 * 1000),
    };
  });

  const insertedIssues = await Issue.insertMany(issueDocs, { ordered: true });
  console.log(`✅  Inserted ${insertedIssues.length} issues\n`);

  // ── 6. Update user verificationCounts from issues ─────────────────────────
  console.log('🔄  Syncing user credibility scores...');
  for (const issue of insertedIssues) {
    await User.findByIdAndUpdate(issue.createdBy, {
      $inc: { verificationCount: issue.verificationCount },
    });
  }
  console.log('✅  Credibility sync done\n');

  // ── 7. Print summary ───────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════');
  console.log('📊  SEED SUMMARY');
  console.log('═══════════════════════════════════════════════');

  const statusGroups = {};
  for (const issue of insertedIssues) {
    statusGroups[issue.status] = (statusGroups[issue.status] || 0) + 1;
  }

  const catGroups = {};
  for (const issue of insertedIssues) {
    catGroups[issue.category] = (catGroups[issue.category] || 0) + 1;
  }

  console.log(`\n👥  Users created        : ${insertedUsers.length}`);
  console.log(`     ↳ Pune (≤10 km)       : 45`);
  console.log(`     ↳ Other cities        : 5  (Mumbai · Delhi · Bengaluru · Chennai · Hyderabad)`);
  
  const roleCount = {};
  for (const u of insertedUsers) roleCount[u.role] = (roleCount[u.role] || 0) + 1;
  for (const [role, count] of Object.entries(roleCount)) {
    console.log(`     ↳ Role "${role}"${' '.repeat(12 - role.length)}: ${count}`);
  }

  console.log(`\n📋  Issues created       : ${insertedIssues.length}`);
  console.log('\n  By Status:');
  for (const [status, count] of Object.entries(statusGroups)) {
    console.log(`     ↳ ${status.padEnd(12)}: ${count}`);
  }
  console.log('\n  By Category:');
  for (const [cat, count] of Object.entries(catGroups)) {
    console.log(`     ↳ ${cat.padEnd(16)}: ${count}`);
  }

  console.log('\n🔑  Test login credentials:');
  console.log(`     Email   : ${insertedUsers[0].email}`);
  console.log(`     Password: Seed@123456`);
  console.log('\n  First 5 Pune users:');
  for (const u of insertedUsers.slice(0, 5)) {
    console.log(`     [${u.role.padEnd(8)}] ${u.name.padEnd(30)} — ${u.locationName}`);
  }
  console.log('\n  City users:');
  for (const u of insertedUsers.slice(45)) {
    console.log(`     [${u.role.padEnd(8)}] ${u.name.padEnd(30)} — ${u.locationName}`);
  }

  console.log('\n✅  Seed completed successfully!');
  console.log('═══════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
