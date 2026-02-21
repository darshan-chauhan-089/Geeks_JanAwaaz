/**
 * Loader — spinner component.
 *
 * Props:
 *   fullScreen  {boolean}  — center in the viewport (default: false)
 *   size        {number}   — spinner diameter in px (default: 40)
 *   label       {string}   — accessible label (default: 'Loading…')
 */
export default function Loader({ fullScreen = false, size = 40, label = 'Loading…' }) {
  const style = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...(fullScreen && {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(255,255,255,0.75)',
      zIndex: 9999,
    }),
  };

  const spinnerStyle = {
    width:  size,
    height: size,
    border: `${Math.max(2, size / 10)}px solid var(--color-border)`,
    borderTopColor: 'var(--color-primary)',
    borderRadius: '50%',
    animation: 'loader-spin 0.75s linear infinite',
  };

  return (
    <>
      <style>{`@keyframes loader-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={style} role="status" aria-label={label}>
        <span style={spinnerStyle} aria-hidden="true" />
        <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
          {label}
        </span>
      </div>
    </>
  );
}
