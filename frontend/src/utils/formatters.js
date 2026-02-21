import { MAX_FILE_SIZE_MB } from './constants';

/** ─── Date / Time ─────────────────────────────────────────────────────────── */

/**
 * "2 hours ago", "3 days ago", etc.
 */
export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);

  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 30)  return `${days} day${days > 1 ? 's' : ''} ago`;

  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/**
 * Full date + time string for tooltips.
 */
export function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short',
  });
}

/** ─── Numbers ──────────────────────────────────────────────────────────────── */

/**
 * 1500 → "1.5K",  2_400_000 → "2.4M"
 */
export function formatCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Distance in metres → human-readable string.
 */
export function formatDistance(metres) {
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`;
  return `${Math.round(metres)} m`;
}

/** ─── Files ────────────────────────────────────────────────────────────────── */

/**
 * Convert File size to "3.2 MB".
 */
export function formatFileSize(bytes) {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1_048_576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

/**
 * Validate files selected for upload.
 * Returns an array of error strings (empty = all good).
 */
export function validateFiles(files, maxCount = 5) {
  const errors = [];
  if (files.length > maxCount) {
    errors.push(`You can upload at most ${maxCount} files.`);
  }
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_MB * 1_048_576) {
      errors.push(`"${file.name}" exceeds ${MAX_FILE_SIZE_MB} MB limit.`);
    }
    if (!file.type.startsWith('image/')) {
      errors.push(`"${file.name}" is not an image.`);
    }
  }
  return errors;
}

/** ─── GeoJSON ─────────────────────────────────────────────────────────────── */

/**
 * Build a GeoJSON Point object (for issue creation).
 * @param {number} lat
 * @param {number} lng
 * @param {{ city?, address?, ward? }} meta
 */
export function buildGeoPoint(lat, lng, meta = {}) {
  return {
    type: 'Point',
    coordinates: [lng, lat], // GeoJSON: [longitude, latitude]
    ...meta,
  };
}

/**
/**
 * Reverse geocode coordinates to a full Indian address using
 * OpenStreetMap Nominatim (free, no API key required).
 *
 * Returns structured Indian address fields + a formatted single-line label.
 * Never throws — failure returns empty strings so submission still works.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{
 *   road: string,
 *   locality: string,
 *   taluka: string,
 *   district: string,
 *   state: string,
 *   pincode: string,
 *   city: string,
 *   ward: string,
 *   address: string,
 *   fullLabel: string,
 * }>}
 */
export async function reverseGeocode(lat, lng) {
  const empty = {
    road: '', locality: '', taluka: '', district: '',
    state: '', pincode: '', city: '', ward: '', address: '', fullLabel: '',
  };
  try {
    // Use the backend proxy to avoid Nominatim CORS restrictions.
    // The backend forwards the request server-side (no browser-origin restriction).
    const url = `/api/v1/geocode/reverse?lat=${lat}&lng=${lng}`;

    const res = await fetch(url);

    if (!res.ok) return empty;

    const data = await res.json();
    const a = data.address ?? {};

    // ── Extract each Indian administrative level ──────────────────────────
    const road      = a.road ?? a.pedestrian ?? a.footway ?? a.path ?? '';
    const locality  = a.suburb ?? a.neighbourhood ?? a.quarter ??
                      a.village ?? a.hamlet ?? '';
    const taluka    = a.county ?? a.subdistrict ?? a.district ?? '';
    const district  = a.state_district ??
                      (a.county !== taluka ? a.county : '') ?? '';
    const state     = a.state ?? '';
    const pincode   = a.postcode ?? '';
    const city      = a.city ?? a.town ?? a.municipality ?? locality ?? '';
    const ward      = locality || taluka;

    // ── Build a clean short address for the DB (road + locality + city) ───
    const shortParts = [road, locality || city].filter(Boolean);
    const address = shortParts.length
      ? shortParts.join(', ')
      : (data.display_name?.split(',').slice(0, 3).join(',') ?? '');

    // ── Build the full human-readable label shown in the read-only box ────
    // Format: Road, Locality, Taluka, District, State – Pincode
    const labelParts = [
      road,
      locality,
      taluka && taluka !== locality  ? taluka   : '',
      district && district !== taluka ? district : '',
      state,
    ].filter(Boolean);

    // Remove consecutive duplicates (Nominatim sometimes repeats values)
    const deduped = labelParts.filter((v, i, arr) => v !== arr[i - 1]);
    const fullLabel = deduped.join(', ') + (pincode ? ` – ${pincode}` : '');

    return { road, locality, taluka, district, state, pincode, city, ward, address, fullLabel };
  } catch {
    return empty;
  }
}
