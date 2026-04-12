export default function Home() {
  return (
    <main className="min-h-screen" style={{backgroundColor: "#fff"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "2px solid #2C2C2A", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#2C2C2A", letterSpacing: "-1px", textDecoration: "none"}}>
            Framio
          </a>
          <span style={{fontSize: "8px", letterSpacing: "4px", color: "#888", paddingLeft: "8px", borderLeft: "1px solid #ddd"}}>PHOTOGRAPHY</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/photographers" style={{color: "#888", fontSize: "12px"}}>Explore</a>
          <a href="#" style={{color: "#888", fontSize: "12px"}}>For Photographers</a>
          <a href="/signup" style={{backgroundColor: "#2C2C2A", color: "#fff", fontSize: "12px", padding: "7px 20px", textDecoration: "none"}}>
            Sign up
          </a>
        </div>
      </nav>

      {/* Hero — dark block */}
      <section style={{backgroundColor: "#2C2C2A", padding: "64px 48px"}}>
        <p style={{fontSize: "9px", letterSpacing: "5px", color: "#888", margin: "0 0 20px"}}>
          PHOTOGRAPHY MARKETPLACE — 2026
        </p>
        <h1 style={{fontFamily: "Georgia, serif", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: "700", color: "#fff", margin: "0", letterSpacing: "-2px", lineHeight: "1.05"}}>
          Find the perfect<br/>photographer,<br/><em style={{fontWeight: "400"}}>anywhere.</em>
        </h1>
      </section>

      {/* Search bar */}
      <section style={{backgroundColor: "#fff", padding: "32px 48px", borderBottom: "1px solid #f0f0f0"}}>
        <div style={{border: "1px solid #2C2C2A", padding: "10px 10px 10px 24px", display: "flex", alignItems: "center", gap: "12px", maxWidth: "560px"}}>
          <input
            type="text"
            placeholder="Where are you looking for a photographer?"
            style={{flex: 1, border: "none", outline: "none", fontSize: "13px", color: "#2C2C2A", backgroundColor: "transparent", fontStyle: "italic"}}
          />
          <button style={{backgroundColor: "#2C2C2A", color: "#fff", fontSize: "11px", padding: "10px 24px", border: "none", cursor: "pointer", letterSpacing: "1px"}}>
            SEARCH
          </button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-3 mt-4">
          {["Weddings", "Portraits", "Events", "Travel", "Fashion", "Commercial"].map((cat) => (
            <a key={cat} href="/photographers" style={{fontSize: "11px", color: "#2C2C2A", border: "1px solid #2C2C2A", padding: "6px 16px", textDecoration: "none", letterSpacing: "1px"}}>
              {cat}
            </a>
          ))}
        </div>
      </section>

      {/* Featured photographers strip */}
      <section style={{backgroundColor: "#fff", padding: "48px 48px", borderBottom: "1px solid #f0f0f0"}}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <p style={{fontSize: "9px", letterSpacing: "5px", color: "#888", margin: "0 0 8px"}}>FEATURED</p>
            <h2 style={{fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: "700", color: "#2C2C2A", margin: "0", letterSpacing: "-1px"}}>Our photographers</h2>
          </div>
          <a href="/photographers" style={{fontSize: "11px", color: "#2C2C2A", letterSpacing: "2px", textDecoration: "none", borderBottom: "1px solid #2C2C2A", paddingBottom: "2px"}}>
            VIEW ALL
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: "Sofia A.", location: "Bergen", specialty: "Weddings" },
            { name: "Erik L.", location: "Oslo", specialty: "Portraits" },
            { name: "Mia K.", location: "Stockholm", specialty: "Fashion" },
            { name: "Lars B.", location: "Copenhagen", specialty: "Travel" },
          ].map((p) => (
            <a key={p.name} href="/photographers" style={{textDecoration: "none"}}>
              <div style={{backgroundColor: "#f5f5f5", aspectRatio: "3/4", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center"}}>
                <span style={{fontSize: "32px", fontFamily: "Georgia, serif", fontWeight: "700", color: "#ddd"}}>{p.name[0]}</span>
              </div>
              <p style={{fontSize: "13px", fontWeight: "700", color: "#2C2C2A", margin: "0 0 2px", fontFamily: "Georgia, serif"}}>{p.name}</p>
              <p style={{fontSize: "11px", color: "#888", margin: "0", letterSpacing: "1px"}}>{p.location} — {p.specialty}</p>
            </a>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{backgroundColor: "#f5f5f5", padding: "64px 48px", borderTop: "0.5px solid #e5e5e5"}}>
        <div style={{maxWidth: "800px"}}>
          <p style={{fontSize: "9px", letterSpacing: "5px", color: "#888", margin: "0 0 12px"}}>HOW IT WORKS</p>
          <h2 style={{fontFamily: "Georgia, serif", fontSize: "36px", fontWeight: "700", color: "#2C2C2A", margin: "0 0 48px", letterSpacing: "-1px"}}>
            Three simple steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { num: "01", title: "Search", desc: "Browse our curated photographers by location, style and price." },
              { num: "02", title: "Book", desc: "Choose your session, pick a date and confirm securely in minutes." },
              { num: "03", title: "Shoot", desc: "Meet your photographer and receive your edited photos within days." },
            ].map((item) => (
              <div key={item.num}>
                <p style={{fontFamily: "Georgia, serif", fontSize: "40px", fontWeight: "700", color: "#e0e0e0", margin: "0 0 12px", letterSpacing: "-2px"}}>{item.num}</p>
                <p style={{fontSize: "16px", fontWeight: "700", color: "#2C2C2A", margin: "0 0 8px"}}>{item.title}</p>
                <p style={{fontSize: "13px", color: "#888", margin: "0", lineHeight: "1.7"}}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join as photographer */}
      <section style={{backgroundColor: "#2C2C2A", padding: "64px 48px"}}>
        <div className="flex items-center justify-between flex-wrap gap-8">
          <div>
            <p style={{fontSize: "9px", letterSpacing: "5px", color: "#888", margin: "0 0 12px"}}>FOR PHOTOGRAPHERS</p>
            <h2 style={{fontFamily: "Georgia, serif", fontSize: "36px", fontWeight: "700", color: "#fff", margin: "0 0 12px", letterSpacing: "-1px"}}>
              Join Framio today
            </h2>
            <p style={{fontSize: "14px", color: "#888", margin: "0", maxWidth: "400px", lineHeight: "1.7"}}>
              Reach clients worldwide. Set your own prices. Build your photography business with Framio.
            </p>
          </div>
          <a href="/signup" style={{backgroundColor: "#fff", color: "#2C2C2A", fontSize: "12px", padding: "16px 40px", textDecoration: "none", letterSpacing: "2px", fontWeight: "700", flexShrink: 0}}>
            APPLY NOW
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{backgroundColor: "#fff", padding: "32px 48px", borderTop: "2px solid #2C2C2A", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"}}>
        <div>
          <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#2C2C2A", margin: "0 0 4px", letterSpacing: "-0.5px"}}>Framio</p>
          <p style={{fontSize: "8px", letterSpacing: "3px", color: "#888", margin: "0"}}>PHOTOGRAPHY MARKETPLACE</p>
        </div>
        <div className="flex gap-8">
          <a href="/photographers" style={{fontSize: "11px", color: "#888", textDecoration: "none", letterSpacing: "1px"}}>Explore</a>
          <a href="/signup" style={{fontSize: "11px", color: "#888", textDecoration: "none", letterSpacing: "1px"}}>Sign up</a>
          <a href="/login" style={{fontSize: "11px", color: "#888", textDecoration: "none", letterSpacing: "1px"}}>Login</a>
        </div>
        <p style={{fontSize: "11px", color: "#888", margin: "0", letterSpacing: "1px"}}>© 2026 FRAMIO. ALL RIGHTS RESERVED.</p>
      </footer>

    </main>
  );
}