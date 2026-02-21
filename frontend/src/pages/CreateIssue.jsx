import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueService } from '@services/issueService';
import { ISSUE_CATEGORIES, MAX_FILES, MAX_FILE_SIZE_MB } from '@utils/constants';
import { validateFiles, reverseGeocode } from '@utils/formatters';

export default function CreateIssue() {
  const navigate = useNavigate();
  const fileRef  = useRef();

  const [form, setForm] = useState({
    title:       '',
    description: '',
    category:    ISSUE_CATEGORIES[0],
  });
  const [files,      setFiles]      = useState([]);
  const [fileErrs,   setFileErrs]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [apiError,   setApiError]   = useState('');
  const [geoError,   setGeoError]   = useState('');
  const [geoStatus,  setGeoStatus]  = useState('');
  // Stored GPS fix — kept in state so handleSubmit can always read it
  const [coords,     setCoords]     = useState(null);       // { lat, lng }
  const [geoMeta,    setGeoMeta]    = useState(null);       // full reverseGeocode result
  const [locLabel,   setLocLabel]   = useState('');         // display string in readonly box

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // Detect location as soon as the component mounts
  useEffect(() => {
    let cancelled = false;
    setGeoStatus('Detecting your location…');
    setGeoError('');

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setGeoStatus('');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords: c }) => {
        if (cancelled) return;
        const lat = c.latitude;
        const lng = c.longitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          setGeoError('Your device returned invalid coordinates. Please try again.');
          setGeoStatus('');
          return;
        }
        setCoords({ lat, lng });
        setGeoStatus('Looking up your address…');

        const meta = await reverseGeocode(lat, lng);
        if (cancelled) return;
        setGeoMeta(meta);

        // Build a rich display label
        const label = meta.fullLabel ||
          [meta.road, meta.locality, meta.taluka, meta.district, meta.state]
            .filter(Boolean).join(', ');
        setLocLabel(label || 'Location detected');
        setGeoStatus('');
      },
      (err) => {
        if (cancelled) return;
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Please allow access in browser settings and reload.'
            : err.code === err.POSITION_UNAVAILABLE
            ? 'Could not determine your location. Check your device GPS / network.'
            : 'Location request timed out. Please reload and try again.';
        setGeoError(msg);
        setGeoStatus('');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
    return () => { cancelled = true; };
  }, []);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    const errs = validateFiles(selected, MAX_FILES);
    setFileErrs(errs);
    if (!errs.length) setFiles(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    // ── Client-side guards — catch obvious errors before hitting the server ──
    if (form.title.trim().length < 5) {
      setApiError('Title must be at least 5 characters.');
      return;
    }
    if (form.description.trim().length < 10) {
      setApiError('Description must be at least 10 characters.');
      return;
    }
    if (fileErrs.length) return;

    if (!coords) {
      setGeoError('Location not yet detected. Please wait or reload and allow location access.');
      return;
    }

    // Extra guard: GPS returned but values are somehow invalid
    if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) {
      setGeoError(`GPS returned invalid coordinates (lat=${coords.lat}, lng=${coords.lng}). Please reload.`);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      // Build GeoJSON explicitly — Number() cast ensures types are always
      // numeric even if GPS coords somehow arrived as strings.
      const locationPayload = {
        type:        'Point',
        coordinates: [Number(coords.lng), Number(coords.lat)], // GeoJSON: [longitude, latitude]
        ...(geoMeta?.city    ? { city:    geoMeta.city    } : {}),
        ...(geoMeta?.address ? { address: geoMeta.address } : {}),
        ...(geoMeta?.ward    ? { ward:    geoMeta.ward    } : {}),
      };

      const locationJson = JSON.stringify(locationPayload);

      const fd = new FormData();
      fd.append('title',       form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('category',    form.category);
      fd.append('location',    locationJson);
      files.forEach((file) => fd.append('images', file));

      await issueService.createIssue(fd);
      navigate('/dashboard');
    } catch (err) {
      // err.message is the backend validation message (set by api.js interceptor)
      const msg = err?.message || 'Failed to submit issue. Please try again.';
      setApiError(msg);
      console.error('[CreateIssue] submit error status:', err?.status);
      console.error('[CreateIssue] submit error data:', err?.data);
      console.error('[CreateIssue] submit error message:', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 620, margin: '0 auto', padding: '2rem 1rem', background: '#ffffff', minHeight: '100vh' }}>
      <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-primary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
        ← Back
      </button>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.6rem', fontWeight: 700, color: '#111827' }}>Report an Issue</h1>

      {apiError && (
        <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid #fca5a5', fontWeight: 500 }}>
          ❌ {apiError}
        </div>
      )}
      {geoError && (
        <div style={{ background: '#fffbeb', color: '#92400e', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⚠️ {geoError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Title *</label>
          <input name="title" value={form.title} onChange={handleChange} required maxLength={200} placeholder="Brief description of the issue" style={inputStyle} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange} required rows={4} maxLength={2000} placeholder="Detailed description…" style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        {/* Category */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Category *</label>
          <select name="category" value={form.category} onChange={handleChange} style={inputStyle}>
            {ISSUE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Detected Location — read-only */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Detected Location</label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: '0.75rem', top: '50%',
              transform: 'translateY(-50%)', fontSize: '1rem', pointerEvents: 'none',
            }}>&#128205;</span>
            <input
              readOnly
              value={
                geoStatus
                  ? geoStatus
                  : locLabel
                    ? locLabel
                    : geoError
                      ? 'Location unavailable'
                      : 'Waiting for GPS…'
              }
              style={{
                ...inputStyle,
                paddingLeft: '2.25rem',
                background: '#f1f5f9',
                color: locLabel ? '#1e3a5f' : '#9ca3af',
                cursor: 'default',
                fontWeight: locLabel ? 500 : 400,
              }}
            />
            {geoStatus && (
              <span style={{
                position: 'absolute', right: '0.75rem', top: '50%',
                transform: 'translateY(-50%)',
                display: 'inline-block', width: 14, height: 14,
                border: '2px solid #2563eb', borderTopColor: 'transparent',
                borderRadius: '50%', animation: 'spin 0.7s linear infinite',
              }} />
            )}
          </div>
          {/* Full breakdown chips */}
          {geoMeta && locLabel && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
              {[
                geoMeta.road && { label: '🛣️ Road', value: geoMeta.road },
                geoMeta.locality && { label: '🏘️ Area', value: geoMeta.locality },
                geoMeta.taluka && { label: '📍 Taluka', value: geoMeta.taluka },
                geoMeta.district && geoMeta.district !== geoMeta.taluka && { label: '🏛️ District', value: geoMeta.district },
                geoMeta.state && { label: '🗺️ State', value: geoMeta.state },
                geoMeta.pincode && { label: '📮 PIN', value: geoMeta.pincode },
              ].filter(Boolean).map(({ label, value }) => (
                <span key={label} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                  background: '#eff6ff', color: '#1e40af',
                  fontSize: '0.75rem', fontWeight: 500,
                  padding: '0.2rem 0.6rem', borderRadius: '999px',
                  border: '1px solid #bfdbfe',
                }}>
                  <span style={{ color: '#6b7280', fontWeight: 400 }}>{label}:</span> {value}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Images */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Photos (up to {MAX_FILES}, max {MAX_FILE_SIZE_MB} MB each)</label>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
          <button type="button" onClick={() => fileRef.current.click()} style={{ border: '2px dashed #d1d5db', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', background: '#f8fafc', cursor: 'pointer', width: '100%', color: '#6b7280', fontSize: '0.95rem', transition: 'border-color 0.15s' }}>
            {files.length ? `${files.length} file(s) selected` : 'Click to select images'}
          </button>
          {fileErrs.map((err, i) => <p key={i} style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{err}</p>)}
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.78rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'background 0.15s' }}>
          {loading ? 'Submitting…' : 'Submit Issue'}
        </button>
      </form>
    </main>
  );
}

const labelStyle = { display: 'block', fontWeight: 500, marginBottom: '0.3rem', fontSize: '0.9rem', color: '#374151' };
const inputStyle = {
  width: '100%',
  padding: '0.6rem 0.8rem',
  border: '1.5px solid #d1d5db',
  borderRadius: 'var(--radius)',
  fontSize: '1rem',
  outline: 'none',
  background: '#ffffff',
  color: '#111827',
  transition: 'border-color 0.15s',
};
