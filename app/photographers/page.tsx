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
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p style={{fontSize: "13px", color: "#C4907A"}}>Loading...</p>
    </div>
  );

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAFAF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>Lomissa</a>
        </div>
        <div className="flex items-center gap-6">
          <a href="/" style={{color: "#888", fontSize: "13px", textDecoration: "none"}}>Home</a>
          <a href="/signup" style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "8px 20px", borderRadius: "24px", textDecoration: "none"}}>Sign up</a>
        </div>
      </nav>

      {/* Header */}
      <section style={{backgroundColor: "#fff", padding: "48px", borderBottom: "1px solid #f0f0f0"}}>
        <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>Our photographers</p>
        <h1 style={{fontFamily: "Georgia, serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: "700", color: "#1a1a1a", margin: "0 0 24px", letterSpacing: "-1px"}}>
          Find your photographer
        </h1>

        {/* Search bar */}
        <div style={{position: "relative", maxWidth: "560px", marginBottom: "24px"}}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, location or specialty..."
            style={{width: "100%", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "14px 20px", paddingLeft: "44px", fontSize: "14px", outline: "none", color: "#1a1a1a", backgroundColor: "#fff", boxSizing: "border-box"}}
          />
          <span style={{position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "16px"}}>🔍</span>
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#888"}}
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
              style={{padding: "6px 16px", borderRadius: "20px", border: specialty === s ? "1px solid #1a1a1a" : "1px solid #e5e5e5", backgroundColor: specialty === s ? "#1a1a1a" : "#fff", color: specialty === s ? "#fff" : "#888", fontSize: "12px", cursor: "pointer", fontWeight: specialty === s ? "600" : "400", transition: "all 0.15s"}}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
          <span style={{fontSize: "12px", color: "#888"}}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{border: "1px solid #e5e5e5", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", outline: "none", backgroundColor: "#fff", color: "#1a1a1a", cursor: "pointer"}}
          >
            <option value="newest">Newest first</option>
            <option value="rating">Highest rated</option>
            <option value="price_low">Price — low to high</option>
            <option value="price_high">Price — high to low</option>
          </select>
          <span style={{fontSize: "12px", color: "#888"}}>
            {filtered.length} photographer{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </section>

      {/* Photographers grid */}
      <div style={{maxWidth: "1100px", margin: "0 auto", padding: "48px 32px"}}>
        {filtered.length === 0 ? (
          <div style={{textAlign: "center", padding: "80px 0"}}>
            <div style={{fontSize: "48px", marginBottom: "16px"}}>🔍</div>
            <p style={{fontFamily: "Georgia, serif", fontSize: "24px", color: "#1a1a1a", margin: "0 0 8px"}}>No photographers found</p>
            <p style={{fontSize: "14px", color: "#888", margin: "0 0 24px"}}>Try a different search or filter</p>
            <button
              onClick={() => { setSearch(""); setSpecialty("All"); setSortBy("newest"); }}
              style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "12px 32px", borderRadius: "8px", border: "none", cursor: "pointer"}}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((photographer) => (
              <a key={photographer.id} href={`/photographers/${photographer.id}`} style={{textDecoration: "none", display: "block", backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden", border: "1px solid #f0f0f0", boxShadow: "0 2px 16px rgba(0,0,0,0.04)", transition: "transform 0.2s, box-shadow 0.2s"}}>
                <div style={{height: "200px", backgroundColor: "#FDF8F5", display: "flex", alignItems: "center", justifyContent: "center"}}>
                  <span style={{fontFamily: "Georgia, serif", fontSize: "64px", fontWeight: "700", color: "#C4907A"}}>{photographer.name?.[0]}</span>
                </div>
                <div style={{padding: "24px"}}>
                  <p style={{fontSize: "11px", color: "#C4907A", margin: "0 0 6px", letterSpacing: "1px"}}>{photographer.specialty}</p>
                  <h3 style={{fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px"}}>{photographer.name}</h3>
                  <p style={{fontSize: "13px", color: "#888", margin: "0 0 16px"}}>{photographer.location}</p>
                  <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px"}}>
                    <span style={{fontSize: "13px", color: "#888"}}>⭐ {photographer.rating || "New"}</span>
                    <span style={{fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: "700", color: "#1a1a1a"}}>{photographer.price}</span>
                  </div>
                  <div style={{display: "block", textAlign: "center", backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "10px", borderRadius: "8px", fontWeight: "600"}}>
                    View profile
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#fff", padding: "32px 48px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <div>
          <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px"}}>Lomissa</p>
          <p style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", margin: "0"}}>PHOTOGRAPHY MARKETPLACE</p>
        </div>
        <div style={{display: "flex", gap: "24px"}}>
          <a href="/privacy" style={{fontSize: "12px", color: "#888", textDecoration: "none"}}>Privacy</a>
          <a href="/terms" style={{fontSize: "12px", color: "#888", textDecoration: "none"}}>Terms</a>
        </div>
        <p style={{fontSize: "12px", color: "#888", margin: "0"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}