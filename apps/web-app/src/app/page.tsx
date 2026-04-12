'use client'

export default function HomePage() {
  return (
    <>
      <nav>
        <a href="#" className="logo">Rw<span>o</span>te</a>
        <a href="#waitlist" className="nav-cta">Get Early Access</a>
      </nav>

      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">✦ Research notes, reimagined</p>
          <h1>Think it.<br /><em>Tag it.</em><br />Find it later.</h1>
          <p className="hero-sub">
            Rwote lives in your browser. Capture insights while you research — with AI tools, articles, or anywhere on the web. Tagged, searchable, always there.
          </p>
          <div className="cta-group">
            <a href="#waitlist" className="btn-primary">Join the waitlist</a>
            <a href="#features" className="btn-ghost">See how it works →</a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="browser-frame">
            <div className="browser-bar">
              <div className="dot dot-r"></div>
              <div className="dot dot-y"></div>
              <div className="dot dot-g"></div>
            </div>
            <div className="extension-ui">
              <div className="ext-header">
                <span className="ext-logo">Rwote</span>
                <span className="ext-count">2 notes ≡</span>
              </div>
              <div className="ext-search">🔍 Search notes...</div>
              <div className="ext-filter">🏷 Filter by tag...</div>
              <div className="note-card">
                <span className="note-tag tag-saas">SAAS</span>
                <div className="note-title">build saas</div>
                <div className="note-date">12 Apr 2026</div>
              </div>
              <div className="note-card">
                <span className="note-tag tag-dsa">DSA</span>
                <div className="note-title">Solve problem</div>
                <div className="note-date">12 Apr 2026</div>
              </div>
              <div className="ext-input-area">
                <div className="ext-input">Write your note... use #tag for tags</div>
                <div className="ext-input">Extra context (optional)...</div>
                <div className="ext-save">Save</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider">
        <div className="divider-line"></div>
        <div className="divider-text">Built for researchers, builders, and curious minds</div>
        <div className="divider-line"></div>
      </div>

      <section className="features" id="features">
        <p className="eyebrow">How it works</p>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-num">01</div>
            <h3>Capture anywhere</h3>
            <p>Write notes directly in your browser while you research — no switching tabs, no losing context. Works alongside any AI tool or website.</p>
          </div>
          <div className="feature">
            <div className="feature-num">02</div>
            <h3>Tag instantly</h3>
            <p>Use #tags inline as you type. Notes are organised automatically. Filter and find exactly what you saved — even weeks later.</p>
          </div>
          <div className="feature">
            <div className="feature-num">03</div>
            <h3>Search everything</h3>
            <p>Full-text search across all your notes and tags. Your research stays connected to where you found it — always retrievable.</p>
          </div>
        </div>
      </section>

      <section className="waitlist" id="waitlist">
        <h2>Be first to know.</h2>
        <p>Rwote is launching soon. Early access is limited.</p>
        <div className="email-form">
          <input className="email-input" type="email" placeholder="your@email.com" id="emailInput" />
          <button className="email-btn" onClick={handleSubmit}>Notify me</button>
        </div>
        <div className="success-msg" id="successMsg">✓ You're on the list. We'll be in touch.</div>
      </section>

      <footer>
        <a href="#" className="logo">Rw<span>o</span>te</a>
        <span className="footer-note">© 2026 Rwote — Built with intent</span>
      </footer>

      <style jsx global>{`
        /* NAV */
        nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 4rem;
          border-bottom: 1px solid var(--line);
          position: sticky;
          top: 0;
          background: rgba(245, 242, 236, 0.92);
          backdrop-filter: blur(12px);
          z-index: 100;
        }

        .logo {
          font-family: 'Grand Hotel', cursive;
          font-size: 1.8rem;
          font-weight: 400;
          letter-spacing: 0.01em;
          color: var(--ink);
          text-decoration: none;
        }

        .logo span { color: var(--accent); }

        .nav-cta {
          background: var(--ink);
          color: var(--paper);
          border: none;
          padding: 0.6rem 1.4rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          cursor: pointer;
          text-transform: uppercase;
          transition: background 0.2s;
          text-decoration: none;
          display: inline-block;
          border-radius: 999px;
        }

        .nav-cta:hover { background: var(--accent); }

        /* HERO */
        .hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 88vh;
          align-items: center;
          gap: 4rem;
          padding: 4rem 4rem 4rem 4rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero-text { animation: fadeUp 0.8s ease both; }

        .eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 1.2rem;
        }

        h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.8rem, 5vw, 4.2rem);
          line-height: 1.08;
          letter-spacing: -0.03em;
          margin-bottom: 1.5rem;
          color: var(--ink);
        }

        h1 em {
          font-style: italic;
          color: var(--accent);
        }

        .hero-sub {
          font-size: 1.05rem;
          line-height: 1.7;
          color: var(--muted);
          max-width: 420px;
          margin-bottom: 2.5rem;
          font-weight: 300;
        }

        .cta-group { display: flex; gap: 1rem; align-items: center; }

        .btn-primary {
          background: var(--ink);
          color: var(--paper);
          border: none;
          padding: 0.9rem 2rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
          border-radius: 999px;
        }

        .btn-primary:hover { background: var(--accent); transform: translateY(-1px); }

        .btn-ghost {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          color: var(--muted);
          text-decoration: none;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--line);
          padding-bottom: 2px;
          transition: color 0.2s;
        }

        .btn-ghost:hover { color: var(--ink); }

        /* EXTENSION MOCKUP */
        .hero-visual {
          display: flex;
          justify-content: center;
          align-items: center;
          animation: fadeUp 0.8s 0.2s ease both;
        }

        .browser-frame {
          width: 100%;
          max-width: 340px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06);
          overflow: hidden;
          transform: rotate(1.5deg);
          transition: transform 0.4s ease;
        }

        .browser-frame:hover { transform: rotate(0deg) scale(1.02); }

        .browser-bar {
          background: #f0ede8;
          padding: 0.7rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid #e5e2dc;
        }

        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot-r { background: #ff5f57; }
        .dot-y { background: #febc2e; }
        .dot-g { background: #28c840; }

        .extension-ui {
          padding: 1rem;
          font-family: 'DM Sans', sans-serif;
        }

        .ext-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.8rem;
        }

        .ext-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .ext-count {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          color: var(--muted);
        }

        .ext-search {
          background: #f5f5f5;
          border-radius: 20px;
          padding: 0.5rem 1rem;
          font-size: 0.78rem;
          color: #aaa;
          margin-bottom: 0.6rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .ext-filter {
          background: #f5f5f5;
          border-radius: 20px;
          padding: 0.4rem 1rem;
          font-size: 0.72rem;
          color: #bbb;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .note-card {
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 0.8rem;
          margin-bottom: 0.6rem;
        }

        .note-tag {
          display: inline-block;
          padding: 0.15rem 0.5rem;
          border-radius: 20px;
          font-size: 0.65rem;
          font-weight: 500;
          margin-bottom: 0.4rem;
        }

        .note-title { font-size: 0.82rem; font-weight: 500; margin-bottom: 0.2rem; }
        .note-date { font-size: 0.68rem; color: #aaa; font-family: 'DM Mono', monospace; }

        .ext-input-area {
          border-top: 1px solid #eee;
          padding-top: 0.8rem;
          margin-top: 0.8rem;
        }

        .ext-input {
          background: #f9f9f9;
          border-radius: 6px;
          padding: 0.5rem 0.8rem;
          font-size: 0.72rem;
          color: #bbb;
          margin-bottom: 0.4rem;
        }

        .ext-save {
          background: var(--ink);
          color: #fff;
          border-radius: 6px;
          padding: 0.5rem;
          text-align: center;
          font-size: 0.75rem;
          font-weight: 500;
        }

        /* DIVIDER */
        .divider {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 0 4rem;
          margin: 0 auto;
          max-width: 1200px;
        }

        .divider-line { flex: 1; height: 1px; background: var(--line); }
        .divider-text {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          color: var(--muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        /* FEATURES */
        .features {
          padding: 6rem 4rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3rem;
          margin-top: 4rem;
        }

        .feature {
          border-top: 2px solid var(--ink);
          padding-top: 1.5rem;
        }

        .feature-num {
          font-family: 'Playfair Display', serif;
          font-size: 3rem;
          color: var(--line);
          line-height: 1;
          margin-bottom: 1rem;
        }

        .feature h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem;
          margin-bottom: 0.6rem;
        }

        .feature p {
          font-size: 0.88rem;
          line-height: 1.7;
          color: var(--muted);
          font-weight: 300;
        }

        /* WAITLIST */
        .waitlist {
          background: var(--ink);
          color: var(--paper);
          padding: 6rem 4rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .waitlist::before {
          content: 'Rwote';
          position: absolute;
          font-family: 'Playfair Display', serif;
          font-size: 18rem;
          font-weight: 700;
          color: rgba(255,255,255,0.03);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          white-space: nowrap;
          pointer-events: none;
        }

        .waitlist h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          margin-bottom: 1rem;
          position: relative;
        }

        .waitlist p {
          color: rgba(245,242,236,0.5);
          margin-bottom: 2.5rem;
          font-weight: 300;
          position: relative;
        }

        .email-form {
          display: flex;
          gap: 0.6rem;
          max-width: 440px;
          margin: 0 auto;
          position: relative;
        }

        .email-input {
          flex: 1;
          padding: 1rem 1.4rem;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.05);
          color: var(--paper);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
          border-radius: 999px;
        }

        .email-input::placeholder { color: rgba(255,255,255,0.3); }
        .email-input:focus { border-color: rgba(255,255,255,0.4); }

        .email-btn {
          background: var(--accent);
          color: #fff;
          border: none;
          padding: 1rem 1.5rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
          white-space: nowrap;
          border-radius: 999px;
        }

        .email-btn:hover { opacity: 0.88; }

        .success-msg {
          display: none;
          font-family: 'DM Mono', monospace;
          font-size: 0.8rem;
          color: #6fcf97;
          margin-top: 1rem;
          letter-spacing: 0.05em;
        }

        /* FOOTER */
        footer {
          padding: 2rem 4rem;
          border-top: 1px solid var(--line);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        footer .logo { font-size: 1.3rem; }

        .footer-note {
          font-family: 'DM Mono', monospace;
          font-size: 0.68rem;
          color: var(--muted);
          letter-spacing: 0.05em;
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          nav { padding: 1.2rem 1.5rem; }
          .hero { grid-template-columns: 1fr; padding: 3rem 1.5rem; min-height: auto; gap: 3rem; }
          .hero-visual { order: -1; }
          .browser-frame { max-width: 280px; }
          .features { padding: 4rem 1.5rem; }
          .features-grid { grid-template-columns: 1fr; gap: 2rem; }
          .waitlist { padding: 4rem 1.5rem; }
          .email-form { flex-direction: column; }
          footer { padding: 1.5rem; flex-direction: column; gap: 0.5rem; text-align: center; }
          .divider { padding: 0 1.5rem; }
        }
      `}</style>
    </>
  )
}

function handleSubmit() {
  const emailInput = document.getElementById('emailInput') as HTMLInputElement
  const form = document.querySelector('.email-form') as HTMLElement
  const successMsg = document.getElementById('successMsg') as HTMLElement
  
  if (!emailInput?.value || !emailInput.value.includes('@')) {
    emailInput.style.borderColor = '#c8402a'
    return
  }
  form.style.display = 'none'
  successMsg.style.display = 'block'
}
