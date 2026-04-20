"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function Photographers() {
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase
        .from("photographers")
        .select("*")
        .order("created_at", { ascending: false });
      setPhotographers(data || []);
      setLoading(false);
    };
    getData();
  }, []);

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
          <span style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", paddingLeft: "8px", borderLeft: "1px solid #f0f0f0"}}>PHOTOGRAPHY</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/" style={{color: "#888", fontSize: "13px", textDecoration: "none"}}>Home</a>
          <a href="/signup" style={{backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "8px 20px", borderRadius: "24px", textDecoration: "none"}}>Sign up</a>
        </div>
      </nav>

      {/* Header */}
      <section style={{backgroundColor: "#fff", padding: "48px", borderBottom: "1px solid #f0f0f0"}}>
        <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>Our photographers</p>
        <h1 style={{fontFamily: "Georgia, serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>
          Find your photographer
        </h1>
        <p style={{fontSize: "15px", color: "#888", margin: "0"}}>Hand-picked photographers ready to capture your moments</p>
      </section>

      {/* Photographers grid */}
      <div style={{maxWidth: "1100px", margin: "0 auto", padding: "48px 32px"}}>
        {photographers.length === 0 ? (
          <div style={{textAlign: "center", padding: "80px 0"}}>
            <p style={{fontFamily: "Georgia, serif", fontSize: "24px", color: "#aaa"}}>No photographers yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {photographers.map((photographer) => (
              <div key={photographer.id} style={{backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden", border: "1px solid #f0f0f0", boxShadow: "0 2px 16px rgba(0,0,0,0.04)"}}>
                <div style={{height: "200px", backgroundColor: "#FDF8F5", display: "flex", alignItems: "center", justifyContent: "center"}}>
                  <span style={{fontFamily: "Georgia, serif", fontSize: "64px", fontWeight: "700", color: "#C4907A"}}>{photographer.name?.[0]}</span>
                </div>
                <div style={{padding: "24px"}}>
                  <p style={{fontSize: "11px", color: "#C4907A", margin: "0 0 6px", letterSpacing: "1px"}}>{photographer.specialty}</p>
                  <h3 style={{fontFamily: "Georgia, serif", fontSize: "22px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px"}}>{photographer.name}</h3>
                  <p style={{fontSize: "13px", color: "#888", margin: "0 0 16px"}}>{photographer.location}</p>
                  <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px"}}>
                    <span style={{fontSize: "13px", color: "#888"}}>⭐ {photographer.rating || "New"}</span>
                    <span style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#1a1a1a"}}>{photographer.price}</span>
                  </div>
                  <a href={`/photographers/${photographer.id}`} style={{display: "block", textAlign: "center", backgroundColor: "#1a1a1a", color: "#fff", fontSize: "13px", padding: "12px", borderRadius: "8px", textDecoration: "none", fontWeight: "600"}}>
                    View profile
                  </a>
                </div>
              </div>
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
        <p style={{fontSize: "12px", color: "#888", margin: "0"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}