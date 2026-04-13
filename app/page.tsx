export default function Home() {
  return (
    <main className="min-h-screen" style={{backgroundColor: "#fff"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>
            Framio
          </a>
          <span style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", paddingLeft: "8px", borderLeft: "1px solid #f0f0f0"}}>PHOTOGRAPHY</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/photographers" style={{color: "#888", fontSize: "13px", textDecoration: "none"}}>Explore</a>
          <a href="#" style={{color: "#888", fontSize: "13px", textDecoration: "none"}}>For Photographers</a>
          <a href="/signup" style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "8px 20px", borderRadius: "24px", textDecoration: "none"}}>
            Sign up
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{backgroundColor: "#fff", padding: "80px 48px", textAlign: "center"}}>
        <p style={{fontSize: "13px", color: "#C4907A", margin: "0 0 16px", letterSpacing: "1px"}}>
          Photography marketplace
        </p>
        <h1 style={{fontFamily: "Georgia, serif", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: "700", color: "#1a1a1a", margin: "0 0 16px", letterSpacing: "-1px", lineHeight: "1.1"}}>
          Find the perfect photographer,<br/><em style={{fontWeight: "400"}}>anywhere in the world</em>
        </h1>
        <p style={{fontSize: "16px", color: "#888", margin: "0 0 40px", lineHeight: "1.7", maxWidth: "480px", marginLeft: "auto", marginRight: "auto"}}>
          Connect with talented photographers for portraits, weddings, events and more
        </p>

        {/* Search */}
        <div style={{backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "40px", padding: "10px 10px 10px 24px", display: "flex", alignItems: "center", gap: "12px", maxWidth: "560px", margin: "0 auto 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)"}}>
          <input
            type="text"
            placeholder="Where are you looking for a photographer?"
            style={{flex: 1, border: "none", outline: "none", fontSize: "13px", color: "#1a1a1a", backgroundColor: "transparent"}}
          />
          <button style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "10px 24px", borderRadius: "30px", border: "none", cursor: "pointer"}}>
            Search
          </button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3">
          {["Weddings", "Portraits", "Events", "Travel", "Fashion", "Commercial"].map((cat) => (
            <a key={cat} href="/photographers" style={{fontSize: "12px", color: "#888", border: "1px solid #e5e5e5", borderRadius: "20px", padding: "6px 16px", textDecoration: "none", backgroundColor: "#fff"}}>
              {cat}
            </a>
          ))}
        </div>
      </section>

      {/* Featured photographers */}
      <section style={{backgroundColor: "#fff", padding: "0 48px 64px"}}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 6px", letterSpacing: "1px"}}>Featured</p>
            <h2 style={{fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: "0", letterSpacing: "-1px"}}>Our photographers</h2>
          </div>
          <a href="/photographers" style={{fontSize: "13px", color: "#1a1a1a", textDecoration: "none", borderBottom: "1px solid #1a1a1a", paddingBottom: "2px"}}>
            View all
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
              <div style={{backgroundColor: "#f5f5f5", aspectRatio: "3/4", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", overflow: "hidden"}}>
                <span style={{fontSize: "40px", fontFamily: "Georgia, serif", fontWeight: "700", color: "#ddd"}}>{p.name[0]}</span>
              </div>
              <p style={{fontSize: "14px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 2px", fontFamily: "Georgia, serif"}}>{p.name}</p>
              <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 2px"}}>{p.specialty}</p>
              <p style={{fontSize: "12px", color: "#888", margin: "0"}}>{p.location}</p>
            </a>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{backgroundColor: "#FDF8F5", padding: "80px 48px", borderTop: "1px solid #f0e8e0"}}>
        <div style={{maxWidth: "900px", margin: "0 auto", textAlign: "center"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 12px", letterSpacing: "1px"}}>Simple process</p>
          <h2 style={{fontFamily: "Georgia, serif", fontSize: "36px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 56px", letterSpacing: "-1px"}}>
            How Framio works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { num: "1", title: "Search", desc: "Browse photographers by location, style and price. Read reviews from real clients." },
              { num: "2", title: "Book", desc: "Choose your session type, pick a date and confirm securely in minutes." },
              { num: "3", title: "Shoot", desc: "Meet your photographer, have an amazing session and receive your photos within days." },
            ].map((item) => (
              <div key={item.num} className="flex flex-col items-center">
                <div style={{width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "#C4907A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "700", color: "#fff", marginBottom: "20px", fontFamily: "Georgia, serif"}}>
                  {item.num}
                </div>
                <h3 style={{fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 10px", fontFamily: "Georgia, serif"}}>{item.title}</h3>
                <p style={{fontSize: "14px", color: "#888", margin: "0", lineHeight: "1.7"}}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For photographers CTA */}
      <section style={{backgroundColor: "#1a1a1a", padding: "80px 48px"}}>
        <div style={{maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "32px"}}>
          <div>
            <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 12px", letterSpacing: "1px"}}>For photographers</p>
            <h2 style={{fontFamily: "Georgia, serif", fontSize: "36px", fontWeight: "700", color: "#fff", margin: "0 0 12px", letterSpacing: "-1px"}}>
              Grow your photography business
            </h2>
            <p style={{fontSize: "14px", color: "#888", margin: "0", maxWidth: "400px", lineHeight: "1.7"}}>
              Join hundreds of photographers already using Framio to reach new clients, manage bookings and grow their business.
            </p>
          </div>
          <a href="/signup" style={{backgroundColor: "#C4907A", color: "#fff", fontSize: "13px", padding: "16px 40px", borderRadius: "4px", textDecoration: "none", fontWeight: "600", flexShrink: 0, whiteSpace: "nowrap"}}>
            Join as a photographer
          </a>
        </div>
      </section>

      {/* Trust strip */}
      <section style={{backgroundColor: "#fff", padding: "40px 48px", borderTop: "1px solid #f0f0f0"}}>
        <div style={{maxWidth: "900px", margin: "0 auto", display: "flex", justifyContent: "center", gap: "64px", flexWrap: "wrap"}}>
          {[
            { value: "500+", label: "Photographers" },
            { value: "4.9★", label: "Average rating" },
            { value: "10k+", label: "Sessions booked" },
            { value: "50+", label: "Countries" },
          ].map((stat) => (
            <div key={stat.label} style={{textAlign: "center"}}>
              <p style={{fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px"}}>{stat.value}</p>
              <p style={{fontSize: "12px", color: "#888", margin: "0"}}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{backgroundColor: "#fff", padding: "32px 48px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"}}>
        <div>
          <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px", letterSpacing: "-0.5px"}}>Framio</p>
          <p style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", margin: "0"}}>PHOTOGRAPHY MARKETPLACE</p>
        </div>
        <div className="flex gap-8">
          <a href="/photographers" style={{fontSize: "12px", color: "#888", textDecoration: "none"}}>Explore</a>
          <a href="/signup" style={{fontSize: "12px", color: "#888", textDecoration: "none"}}>Sign up</a>
          <a href="/login" style={{fontSize: "12px", color: "#888", textDecoration: "none"}}>Login</a>
        </div>
        <p style={{fontSize: "12px", color: "#888", margin: "0"}}>© 2026 Framio. All rights reserved.</p>
      </footer>

    </main>
  );
}