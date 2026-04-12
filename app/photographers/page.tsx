"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function Photographers() {
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p style={{fontSize: "11px", letterSpacing: "4px", color: "#888"}}>LOADING...</p>
      </div>
    );
  }

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
          <a href="/photographers" style={{color: "#2C2C2A", fontSize: "12px", borderBottom: "1px solid #2C2C2A", paddingBottom: "2px"}}>Explore</a>
          <a href="#" style={{color: "#888", fontSize: "12px"}}>For Photographers</a>
          <a href="/signup" style={{backgroundColor: "#2C2C2A", color: "#fff", fontSize: "12px", padding: "7px 20px", textDecoration: "none"}}>
            Sign up
          </a>
        </div>
      </nav>

      {/* Header */}
      <section style={{backgroundColor: "#2C2C2A", padding: "48px"}}>
        <p style={{fontSize: "9px", letterSpacing: "5px", color: "#888", margin: "0 0 12px"}}>BROWSE</p>
        <h1 style={{fontFamily: "Georgia, serif", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: "700", color: "#fff", margin: "0", letterSpacing: "-2px"}}>
          Our photographers
        </h1>
      </section>

      {/* Filters */}
      <section style={{backgroundColor: "#fff", padding: "20px 48px", borderBottom: "1px solid #f0f0f0"}}>
        <div className="flex flex-wrap gap-3">
          {["All", "Weddings", "Portraits", "Events", "Travel", "Fashion", "Commercial"].map((cat) => (
            <button key={cat} style={{fontSize: "11px", color: "#2C2C2A", border: "1px solid #2C2C2A", padding: "6px 16px", backgroundColor: "transparent", cursor: "pointer", letterSpacing: "1px"}}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Photographers Grid */}
      <section style={{padding: "48px", backgroundColor: "#fff"}}>
        {photographers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p style={{fontFamily: "Georgia, serif", fontSize: "24px", color: "#2C2C2A", margin: "0 0 12px"}}>No photographers yet</p>
            <p style={{fontSize: "13px", color: "#888", margin: "0 0 24px"}}>Be the first photographer to join Framio</p>
            <a href="/signup" style={{backgroundColor: "#2C2C2A", color: "#fff", fontSize: "11px", padding: "12px 32px", textDecoration: "none", letterSpacing: "2px"}}>
              JOIN NOW
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {photographers.map((p) => (
              <div key={p.id}>
                {/* Photo placeholder */}
                <div style={{backgroundColor: "#f5f5f5", aspectRatio: "3/4", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative"}}>
                  <span style={{fontSize: "48px", fontFamily: "Georgia, serif", fontWeight: "700", color: "#ddd"}}>{p.name?.[0] || "?"}</span>
                  <div style={{position: "absolute", top: "12px", left: "12px", backgroundColor: "#2C2C2A", padding: "4px 10px"}}>
                    <span style={{fontSize: "9px", letterSpacing: "2px", color: "#fff"}}>{p.specialty?.toUpperCase() || "PHOTOGRAPHER"}</span>
                  </div>
                </div>
                {/* Info */}
                <div className="flex items-start justify-between">
                  <div>
                    <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#2C2C2A", margin: "0 0 4px"}}>{p.name}</p>
                    <p style={{fontSize: "11px", color: "#888", margin: "0 0 2px", letterSpacing: "1px"}}>{p.location || "Location not set"}</p>
                    <p style={{fontSize: "13px", color: "#2C2C2A", margin: "0", fontFamily: "Georgia, serif"}}>
                      {p.price ? `From ${p.price}` : "Price on request"}
                    </p>
                  </div>
                  <a href={"/photographers/" + p.id} style={{fontSize: "11px", color: "#2C2C2A", border: "1px solid #2C2C2A", padding: "8px 16px", textDecoration: "none", letterSpacing: "1px", flexShrink: 0}}>
                    VIEW
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{backgroundColor: "#fff", padding: "32px 48px", borderTop: "2px solid #2C2C2A", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"}}>
        <div>
          <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#2C2C2A", margin: "0 0 4px", letterSpacing: "-0.5px"}}>Framio</p>
          <p style={{fontSize: "8px", letterSpacing: "3px", color: "#888", margin: "0"}}>PHOTOGRAPHY MARKETPLACE</p>
        </div>
        <p style={{fontSize: "11px", color: "#888", margin: "0", letterSpacing: "1px"}}>© 2026 FRAMIO. ALL RIGHTS RESERVED.</p>
      </footer>

    </main>
  );
}