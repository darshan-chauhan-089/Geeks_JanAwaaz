const { body, query } = require('express-validator');

// ─── Create Issue ─────────────────────────────────────────────────────────────
const createIssueRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required.')
    .isLength({ min: 5, max: 150 }).withMessage('Title must be between 5 and 150 characters.'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required.')
    .isLength({ min: 10, max: 3000 }).withMessage('Description must be between 10 and 3000 characters.'),

  body('category')
    .notEmpty().withMessage('Category is required.')
    .isIn(['road', 'water', 'electricity', 'sanitation', 'safety', 'environment', 'infrastructure', 'other'])
    .withMessage('Invalid category.'),

  body('location')
    .notEmpty().withMessage('Location is required.')
    .custom((value) => {
      let loc;
      try {
        loc = typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        throw new Error('Location must be a valid JSON string.');
      }

      if (!loc || typeof loc !== 'object') {
        throw new Error('Location must be a JSON object.');
      }

      let lngNum, latNum;

      // ── Accept GeoJSON format: { type: "Point", coordinates: [lng, lat] } ──
      if (Array.isArray(loc.coordinates) && loc.coordinates.length === 2) {
        lngNum = Number(loc.coordinates[0]);
        latNum = Number(loc.coordinates[1]);
      }
      // ── Accept flat format: { latitude, longitude } ────────────────────────
      else if (loc.latitude !== undefined && loc.longitude !== undefined) {
        latNum = Number(loc.latitude);
        lngNum = Number(loc.longitude);
      }
      // ── Neither format recognised ──────────────────────────────────────────
      else {
        throw new Error(
          'Location must contain either coordinates: [longitude, latitude] (GeoJSON) ' +
          'or latitude + longitude fields.'
        );
      }

      if (!Number.isFinite(lngNum)) throw new Error(`Longitude must be a finite number (got: ${lngNum}).`);
      if (!Number.isFinite(latNum)) throw new Error(`Latitude must be a finite number (got: ${latNum}).`);
      if (lngNum < -180 || lngNum > 180) throw new Error('Longitude must be between -180 and 180.');
      if (latNum < -90  || latNum > 90)  throw new Error('Latitude must be between -90 and 90.');
      return true;
    }),

  body('seriousnessRating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('seriousnessRating must be an integer between 1 and 5.'),
];

// ─── Verify Issue ─────────────────────────────────────────────────────────────
const verifyIssueRules = [
  body('comment')
    .trim()
    .notEmpty().withMessage('A verification comment is required.')
    .isLength({ min: 5, max: 1000 }).withMessage('Comment must be between 5 and 1000 characters.'),

  body('seriousnessRating')
    .notEmpty().withMessage('seriousnessRating is required for verification.')
    .isInt({ min: 1, max: 5 }).withMessage('seriousnessRating must be an integer between 1 and 5.'),
];

// ─── Add Comment ──────────────────────────────────────────────────────────────
const addCommentRules = [
  body('text')
    .trim()
    .notEmpty().withMessage('Comment text is required.')
    .isLength({ min: 1, max: 1000 }).withMessage('Comment must not exceed 1000 characters.'),
];

// ─── Nearby Issues ────────────────────────────────────────────────────────────
const nearbyRules = [
  query('lat')
    .notEmpty().withMessage('lat is required.')
    .isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90.'),

  query('lng')
    .notEmpty().withMessage('lng is required.')
    .isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180.'),

  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 100 }).withMessage('radius must be between 0.1 and 100 km.'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50.'),
];

module.exports = { createIssueRules, verifyIssueRules, addCommentRules, nearbyRules };
