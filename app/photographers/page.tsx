"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function Photographers() {
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const categories = ["All", "Weddings", "Portraits", "Events", "Travel", "Fashion", "Commercial"];

  useEffect(() => {
    const getPhotographers = async () => {
      const { data } = await supabase
        .from("photographers")
        .select("*")
        .order("created_at", { ascending: false });
      setPhotographers(data || []);
      setLoading(false);
    };
    getPhotographers();
  }, []);

  const filtered = filter === "All"
    ? photographers
    : photographers.filter(p => p.specialty === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p style={{fontSize: "13px", color: "#C4907A"}}>Loading photographers...</p>
      </div>
    );
  }

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
          <a href="/photographers" style={{color: "#1a1a1a", fontSize: "13px", textDecoration: "none", borderBottom: "1px solid #1a1a1a", paddingBottom: "2px"}}>Explore</a>
          <a href="#" style={{color: "#888", fontSize: "13px", textDecoration: "none"}}>For Photographers</a>
          <a href="/signup" style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "8px 20px", borderRadius: "24px", textDecoration: "none"}}>
            Sign up
          </a>
        </div>
      </nav>

      {/* Header */}
      <section style={{backgroundColor: "#FDF8F5", padding: "56px 48px", borderBottom: "1px solid #f0e8e0"}}>
        <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 12px", letterSpacing: "1px"}}>Browse</p>
        <h1 style={{fontFamily: "Georgia, serif", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>
          Our photographers
        </h1>
        <p style={{fontSize: "14px", color: "#888", margin: "0"}}>
          Discover talented photographers around the world
        </p>
      </section>

      {/* Filters */}
      <section style={{backgroundColor: "#fff", padding: "20px 48px", borderBottom: "1px solid #f0f0f0"}}>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{fontSize: "12px", color: filter === cat ? "#fff" : "#888", border: filter === cat ? "1px solid #1a1a1a" : "1px solid #e5e5e5", borderRadius: "20px", padding: "6px 16px", backgroundColor: filter === cat ? "#1a1a1a" : "#fff", cursor: "pointer"}}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section style={{padding: "48px", backgroundColor: "#fff"}}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p style={{fontFamily: "Georgia, serif", fontSize: "24px", color: "#1a1a1a", margin: "0 0 12px"}}>No photographers yet</p>
            <p style={{fontSize: "13px", color: "#888", margin: "0 0 24px"}}>Be the first photographer to join Framio</p>
            <a href="/signup" style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "12px 32px", borderRadius: "4px", textDecoration: "none"}}>
              Join as a photographer
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.map((p) => (
              <div key={p.id}>
                <div style={{backgroundColor: "#f5f5f5", aspectRatio: "3/4", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", overflow: "hidden", position: "relative"}}>
                  <span style={{fontSize: "56px", fontFamily: "Georgia, serif", fontWeight: "700", color: "#ddd"}}>{p.name?.[0] || "?"}</span>
                  <div style={{position: "absolute", top: "12px", left: "12px", backgroundColor: "#C4907A", padding: "4px 12px", borderRadius: "20px"}}>
                    <span style={{fontSize: "11px", color: "#fff"}}>{p.specialty || "Photographer"}</span>
                  </div>
                  {p.rating > 0 && (
                    <div style={{position: "absolute", top: "12px", right: "12px", backgroundColor: "#fff", padding: "4px 10px", borderRadius: "20px"}}>
                      <span style={{fontSize: "11px", color: "#1a1a1a"}}>⭐ {p.rating}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px"}}>{p.name}</p>
                    <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 4px"}}>{p.location || "Location not set"}</p>
                    <p style={{fontSize: "13px", color: "#1a1a1a", margin: "0", fontWeight: "500"}}>
                      {p.price ? `From ${p.price}` : "Price on request"}
                    </p>
                  </div>
                  <a href={"/photographers/" + p.id} style={{fontSize: "12px", color: "#fff", backgroundColor: "#1a1a1a", padding: "8px 16px", borderRadius: "20px", textDecoration: "none", flexShrink: 0, marginLeft: "12px"}}>
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{backgroundColor: "#fff", padding: "32px 48px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"}}>
        <div>
          <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px"}}>Framio</p>
          <p style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", margin: "0"}}>PHOTOGRAPHY MARKETPLACE</p>
        </div>
        <p style={{fontSize: "12px", color: "#888", margin: "0"}}>© 2026 Framio. All rights reserved.</p>
      </footer>

    </main>
  );
}