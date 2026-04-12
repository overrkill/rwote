export default function Footer() {
  return (
    <footer className="border-t border-border py-12 mt-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-2xl" style={{ fontFamily: "'Grand Hotel', cursive" }}>
            Rwote
          </div>
          <p className="text-sm text-tertiary">
            Capture insights. Learn better.
          </p>
          <p className="text-sm text-tertiary">
            © {new Date().getFullYear()} Rwote
          </p>
        </div>
      </div>
    </footer>
  )
}
