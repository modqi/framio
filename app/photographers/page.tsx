"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function Photographers() {
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const specialties = ["All", "Portraits", "Weddings", "Events", "Travel", "Fashion", "Commercial", "Street", "Nature"];

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase
        .from("photographers")
        .select("*")
        .order("created_at", { ascending: false });
      setPhotographers(data || []);
      setFiltered(data || []);
      setLoading(false);
    };
    getData();
  }, []);

  useEffect(() => {
    let results = [...photographers];

    if (search) {
      results = results.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.location?.toLowerCase().includes(search.toLowerCase()) ||
        p.specialty?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (specialty !== "All") {
      results = results.filter(p =>
        p.specialty?.toLowerCase().includes(specialty.toLowerCase())
      );
    }

    if (sortBy === "rating") {
      results = results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "price_low") {
      results = results.sort((a, b) => {
        const aPrice = parseFloat(a.price?.replace(/[^0-9.]/g, "") || "0");
        const bPrice = parseFloat(b.price?.replace(/[^0-9.]/g, "") || "0");
        return aPrice - bPrice;
      });
    } else if (sortBy === "price_high") {
      results = results.sort((a, b) => {
        const aPrice = parseFloat(a.price?.replace(/[^0-9.]/g, "") || "0");
        const bPrice = parseFloat(b.price?.replace(/[^0-9.]/g, "") || "0");
        return bPrice - aPrice;
      });
    }

    setFiltered(results);
  }, [search, specialty, sortBy, photographers]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FAF7F1"}}>
      <p style={{fontSize: "13px", color: "#B85528", fontFamily: "'Jost', sans-serif"}}>Loading...</p>
    </div>
  );

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAF7F1"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E4D8C4", backgroundColor: "rgba(250,247,241,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <a href="/" style={{textDecoration: "none"}}>
          <div style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "24px", fontWeight: "400", color: "#1C1009", letterSpacing: "-0.02em"}}>lomissa</div>
        </a>
        <div className="flex items-center gap-6">
          <a href="/" style={{color: "#7A5235", fontSize: "13px", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Home</a>
          <a href="/signup" style={{backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "13px", padding: "8px 20px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>Sign up</a>
        </div>
      </nav>

      {/* Header */}
      <section style={{backgroundColor: "#FAF7F1", padding: "48px 48px 32px", borderBottom: "1px solid #E4D8C4"}}>
        <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 12px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>OUR PHOTOGRAPHERS</p>
        <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: "400", color: "#1C1009", margin: "0 0 32px", letterSpacing: "-0.02em"}}>
          Find your photographer
        </h1>

        {/* Search bar */}
        <div style={{position: "relative", maxWidth: "560px", marginBottom: "24px"}}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, location or specialty..."
            style={{width: "100%", border: "1px solid #E4D8C4", borderRadius: "999px", padding: "12px 24px", paddingLeft: "48px", fontSize: "14px", outline: "none", color: "#1C1009", backgroundColor: "#FDFBF7", boxSizing: "border-box", fontFamily: "'Jost', sans-serif"}}
          />
          <span style={{position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", fontSize: "16px"}}>🔍</span>
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#9E7250"}}
            >
              ✕
            </button>
          )}
        </div>

        {/* Specialty filters */}
        <div style={{display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px"}}>
          {specialties.map((s) => (
            <button
              key={s}
              onClick={() => setSpecialty(s)}
              style={{padding: "6px 16px", borderRadius: "999px", border: specialty === s ? "1px solid #B85528" : "1px solid #E4D8C4", backgroundColor: specialty === s ? "#B85528" : "#FDFBF7", color: specialty === s ? "#FAF7F1" : "#7A5235", fontSize: "12px", cursor: "pointer", fontWeight: specialty === s ? "500" : "400", fontFamily: "'Jost', sans-serif", letterSpacing: "0.03em"}}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
          <span style={{fontSize: "12px", color: "#9E7250", fontFamily: "'Jost', sans-serif"}}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{border: "1px solid #E4D8C4", borderRadius: "999px", padding: "6px 16px", fontSize: "12px", outline: "none", backgroundColor: "#FDFBF7", color: "#1C1009", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
          >
            <option value="newest">Newest first</option>
            <option value="rating">Highest rated</option>
            <option value="price_low">Price — low to high</option>
            <option value="price_high">Price — high to low</option>
          </select>
          <span style={{fontSize: "12px", color: "#9E7250", fontFamily: "'Jost', sans-serif"}}>
            {filtered.length} photographer{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </section>

      {/* Photographers grid */}
      <div style={{maxWidth: "1100px", margin: "0 auto", padding: "48px 32px"}}>
        {filtered.length === 0 ? (
          <div style={{textAlign: "center", padding: "80px 0"}}>
            <div style={{fontSize: "48px", marginBottom: "16px"}}>🔍</div>
            <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "24px", color: "#1C1009", margin: "0 0 8px"}}>No photographers found</p>
            <p style={{fontSize: "14px", color: "#9E7250", margin: "0 0 24px", fontFamily: "'Jost', sans-serif"}}>Try a different search or filter</p>
            <button
              onClick={() => { setSearch(""); setSpecialty("All"); setSortBy("newest"); }}
              style={{backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((photographer) => (
              <a key={photographer.id} href={`/photographers/${photographer.id}`} style={{textDecoration: "none", display: "block", backgroundColor: "#FDFBF7", borderRadius: "12px", overflow: "hidden", border: "1px solid #E4D8C4", boxShadow: "0 2px 12px rgba(28,16,9,0.06)"}}>
                <div style={{height: "220px", backgroundColor: "#E4D8C4", backgroundImage: "repeating-linear-gradient(-45deg,#E4D8C4,#E4D8C4 6px,#EDE3D1 6px,#EDE3D1 14px)", display: "flex", alignItems: "center", justifyContent: "center"}}>
                  <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "72px", fontWeight: "400", color: "#B85528", opacity: 0.5}}>{photographer.name?.[0]}</span>
                </div>
                <div style={{padding: "24px"}}>
                  <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 6px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{photographer.specialty}</p>
                  <h3 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "500", color: "#1C1009", margin: "0 0 4px"}}>{photographer.name}</h3>
                  <p style={{fontSize: "13px", color: "#9E7250", margin: "0 0 16px", fontFamily: "'Jost', sans-serif"}}>{photographer.location}</p>
                  <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px"}}>
                    <span style={{fontSize: "13px", color: "#9E7250", fontFamily: "'Jost', sans-serif"}}>⭐ {photographer.rating || "New"}</span>
                    <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", fontWeight: "500", color: "#1C1009"}}>{photographer.price}</span>
                  </div>
                  <div style={{display: "block", textAlign: "center", backgroundColor: "#1C1009", color: "#FAF7F1", fontSize: "13px", padding: "10px", borderRadius: "999px", fontWeight: "500", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>
                    View profile
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#FAF7F1", padding: "32px 48px", borderTop: "1px solid #E4D8C4", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <div style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", fontWeight: "400", color: "#1C1009"}}>lomissa</div>
        <div style={{display: "flex", gap: "24px"}}>
          <a href="/privacy" style={{fontSize: "12px", color: "#9E7250", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Privacy</a>
          <a href="/terms" style={{fontSize: "12px", color: "#9E7250", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Terms</a>
        </div>
        <p style={{fontSize: "12px", color: "#C3AB88", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}