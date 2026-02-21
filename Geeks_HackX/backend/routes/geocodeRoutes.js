/**
 * GET /api/v1/geocode/reverse?lat=&lng=
 *
 * Server-side proxy for Nominatim reverse geocoding.
 * Calling Nominatim directly from the browser fails with a CORS error
 * because Nominatim blocks browser-origin XHR/fetch requests.
 * Proxying through the backend avoids that restriction entirely.
 */
const express  = require('express');
const router   = express.Router();
const https    = require('https');

router.get('/reverse', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng query params are required.' });
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return res.status(400).json({ error: 'lat and lng must be finite numbers.' });
  }

  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?lat=${latNum}&lon=${lngNum}&format=json&addressdetails=1&zoom=18`;

  try {
    // node 18+ has global fetch; fall back to https.get for older nodes
    if (typeof fetch !== 'undefined') {
      const upstream = await fetch(url, {
        headers: {
          'User-Agent':      'JanAwaaz-CivicApp/1.0 (civic issue reporter)',
          'Accept-Language': 'en',
          'Accept':          'application/json',
        },
      });
      if (!upstream.ok) {
        return res.status(502).json({ error: 'Geocoding service returned an error.' });
      }
      const data = await upstream.json();
      return res.json(data);
    }

    // Fallback: https.get (Node < 18)
    https.get(url, {
      headers: {
        'User-Agent':      'JanAwaaz-CivicApp/1.0 (civic issue reporter)',
        'Accept-Language': 'en',
        'Accept':          'application/json',
      },
    }, (upstream) => {
      let body = '';
      upstream.on('data', (chunk) => { body += chunk; });
      upstream.on('end', () => {
        try {
          const data = JSON.parse(body);
          res.json(data);
        } catch {
          res.status(502).json({ error: 'Could not parse geocoding response.' });
        }
      });
    }).on('error', (err) => {
      console.error('[geocode proxy] https error:', err.message);
      res.status(502).json({ error: 'Geocoding request failed.' });
    });
  } catch (err) {
    console.error('[geocode proxy] error:', err.message);
    res.status(502).json({ error: 'Geocoding proxy failed.' });
  }
});

module.exports = router;
