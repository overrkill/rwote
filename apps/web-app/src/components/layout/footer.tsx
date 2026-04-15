export default function Footer() {
  return (
    <footer className="py-12 mt-20" style={{ backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-2xl" style={{ fontFamily: "'Grand Hotel', cursive", color: 'var(--text-primary)' }}>
            Rwote
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Capture insights. Learn better.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            © {new Date().getFullYear()} Rwote
          </p>
        </div>
      </div>
    </footer>
  )
}
