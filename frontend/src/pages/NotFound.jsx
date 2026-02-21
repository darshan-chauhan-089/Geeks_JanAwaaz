import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
        404
      </h1>
      <h2 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Page not found</h2>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        style={{
          background: 'var(--color-primary)',
          color: '#fff',
          padding: '0.65rem 1.5rem',
          borderRadius: 'var(--radius)',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Go Home
      </Link>
    </main>
  );
}
