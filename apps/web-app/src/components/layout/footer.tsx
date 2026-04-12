export default function Footer() {
  return (
    <footer className="border-t border-[#d8d8d8] dark:border-[#3a3a38] py-12 mt-20 bg-white dark:bg-[#1a1a19]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-2xl text-[#1a1a1a] dark:text-[#f5f2ec]" style={{ fontFamily: "'Grand Hotel', cursive" }}>
            Rwote
          </div>
          <p className="text-sm text-[#888888] dark:text-[#6a6a68]">
            Capture insights. Learn better.
          </p>
          <p className="text-sm text-[#888888] dark:text-[#6a6a68]">
            © {new Date().getFullYear()} Rwote
          </p>
        </div>
      </div>
    </footer>
  )
}
