"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";

export default function Photographers() {
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [authUser, setAuthUser] = useState<any>(null);

  const specialties = ["All", "Weddings", "Portraits", "Family & Newborn", "Real Estate", "Products", "Events", "Lomissa"];

  useEffect(() => {
    const getData = async () => {
      const [{ data }, { data: { user } }] = await Promise.all([
        supabase
          .from("photographers")
          .select("*, photographer_packages(id, price)")
          .eq("stripe_onboarding_completed", true)
          .order("created_at", { ascending: false }),
        supabase.auth.getUser(),
      ]);
      const withPackages = (data || []).filter((p: any) => p.photographer_packages?.length > 0);
      setPhotographers(withPackages);
      setFiltered(withPackages);
      setAuthUser(user);
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
      results = results.filter(p => {
        if (p.specialities?.length > 0) return p.specialities.includes(specialty);
        return p.specialty?.toLowerCase().includes(specialty.toLowerCase());
      });
    }

    const minPkg = (p: any): number | null => {
      const prices = (p.photographer_packages || []).map((pkg: any) => pkg.price).filter((n: number) => n > 0);
      return prices.length > 0 ? Math.min(...prices) : null;
    };

    if (sortBy === "rating") {
      results = results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "price_low") {
      results = results.sort((a, b) => {
        const aP = minPkg(a), bP = minPkg(b);
        if (aP === null && bP === null) return 0;
        if (aP === null) return 1;
        if (bP === null) return -1;
        return aP - bP;
      });
    } else if (sortBy === "price_high") {
      results = results.sort((a, b) => {
        const aP = minPkg(a), bP = minPkg(b);
        if (aP === null && bP === null) return 0;
        if (aP === null) return 1;
        if (bP === null) return -1;
        return bP - aP;
      });
    }

    setFiltered(results);
  }, [search, specialty, sortBy, photographers]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FDFBF8"}}>
      <p style={{fontSize: "13px", color: "#C8622A", fontFamily: "'Jost', sans-serif"}}>Loading...</p>
    </div>
  );

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <div className="flex items-center gap-6">
          {authUser ? (
            <>
              <span style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>
                {authUser.user_metadata?.name?.split(" ")[0] || "Hi"}
              </span>
              <a
                href={authUser.user_metadata?.role === "photographer" ? "/photographer-dashboard" : "/dashboard"}
                style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "8px 20px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}
              >
                My dashboard
              </a>
            </>
          ) : (
            <>
              <a href="/login" style={{color: "#7A5C44", fontSize: "13px", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Log in</a>
              <a href="/signup" style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "8px 20px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>Sign up</a>
            </>
          )}
        </div>
      </nav>

      {/* Header */}
      <section style={{backgroundColor: "#FDFBF8", padding: "48px 48px 32px", borderBottom: "1px solid #E2D5C8"}}>
        <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>OUR PHOTOGRAPHERS</p>
        <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: "400", color: "#1A0E06", margin: "0 0 32px", letterSpacing: "-0.02em"}}>
          Find your photographer
        </h1>

        {/* Search bar */}
        <div style={{position: "relative", maxWidth: "560px", marginBottom: "24px"}}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, location or specialty..."
            style={{width: "100%", border: "1px solid #E2D5C8", borderRadius: "999px", padding: "12px 24px", paddingLeft: "48px", fontSize: "14px", outline: "none", color: "#1A0E06", backgroundColor: "#FDFBF8", boxSizing: "border-box", fontFamily: "'Jost', sans-serif"}}
          />
          <span style={{position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", }}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#7A5C44" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg></span>
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#7A5C44"}}
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
              style={{padding: "6px 16px", borderRadius: "999px", border: specialty === s ? "1px solid #C8622A" : "1px solid #E2D5C8", backgroundColor: specialty === s ? "#C8622A" : "#FDFBF8", color: specialty === s ? "#FDFBF8" : "#7A5C44", fontSize: "12px", cursor: "pointer", fontWeight: specialty === s ? "500" : "400", fontFamily: "'Jost', sans-serif", letterSpacing: "0.03em"}}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
          <span style={{fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{border: "1px solid #E2D5C8", borderRadius: "999px", padding: "6px 16px", fontSize: "12px", outline: "none", backgroundColor: "#FDFBF8", color: "#1A0E06", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
          >
            <option value="newest">Newest first</option>
            <option value="rating">Highest rated</option>
            <option value="price_low">Price — low to high</option>
            <option value="price_high">Price — high to low</option>
          </select>
          <span style={{fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>
            {filtered.length} photographer{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </section>

      {/* Photographers grid */}
      <div style={{maxWidth: "1100px", margin: "0 auto", padding: "48px 32px"}}>
        {filtered.length === 0 ? (
          <div style={{textAlign: "center", padding: "80px 0"}}>
            <div style={{marginBottom: "16px"}}><svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#C8622A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg></div>
            <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "24px", color: "#1A0E06", margin: "0 0 8px"}}>No photographers found</p>
            <p style={{fontSize: "14px", color: "#7A5C44", margin: "0 0 24px", fontFamily: "'Jost', sans-serif"}}>Try a different search or filter</p>
            <button
              onClick={() => { setSearch(""); setSpecialty("All"); setSortBy("newest"); }}
              style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((photographer) => (
              <a key={photographer.id} href={`/photographers/${photographer.id}`} style={{textDecoration: "none", display: "block", backgroundColor: "#FDFBF8", borderRadius: "12px", overflow: "hidden", border: "1px solid #E2D5C8", boxShadow: "0 2px 12px rgba(28,16,9,0.06)"}}>
                <div style={{height: "220px", backgroundColor: "#E2D5C8", backgroundImage: "repeating-linear-gradient(-45deg,#E2D5C8,#E2D5C8 6px,#EDE3D1 6px,#EDE3D1 14px)", display: "flex", alignItems: "center", justifyContent: "center"}}>
                  <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "72px", fontWeight: "400", color: "#C8622A", opacity: 0.5}}>{photographer.name?.[0]}</span>
                </div>
                <div style={{padding: "24px"}}>
                  <div style={{display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "6px"}}>
                    {(photographer.specialities?.length > 0
                      ? photographer.specialities.slice(0, 2)
                      : photographer.specialty ? [photographer.specialty] : []
                    ).map((cat: string) => (
                      <span key={cat} style={{fontSize: "10px", color: "#C8622A", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E", padding: "2px 8px", borderRadius: "999px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.03em"}}>{cat}</span>
                    ))}
                  </div>
                  <h3 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "500", color: "#1A0E06", margin: "0 0 4px"}}>{photographer.name}</h3>
                  <p style={{fontSize: "13px", color: "#7A5C44", margin: "0 0 16px", fontFamily: "'Jost', sans-serif"}}>{photographer.location}</p>
                  <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px"}}>
                    <span style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}><svg viewBox="0 0 64 64" width="14" height="14" fill="none" style={{display:"inline-block",verticalAlign:"middle",marginRight:"3px"}}><circle cx="32" cy="32" r="9" fill="#C8622A"/><line x1="32" y1="18" x2="32" y2="10" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="46" y1="32" x2="54" y2="32" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="42" y1="22" x2="48" y2="16" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="22" y1="22" x2="16" y2="16" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/></svg>{photographer.rating || "New"}</span>
                    <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", fontWeight: "500", color: "#1A0E06"}}>
                      {(() => {
                        const prices = (photographer.photographer_packages || []).map((p: any) => p.price).filter((n: number) => n > 0);
                        return prices.length > 0 ? `From ${Math.min(...prices).toLocaleString()} NOK` : "";
                      })()}
                    </span>
                  </div>
                  <div style={{display: "block", textAlign: "center", backgroundColor: "#1A0E06", color: "#FDFBF8", fontSize: "13px", padding: "10px", borderRadius: "999px", fontWeight: "500", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>
                    View profile
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#FDFBF8", padding: "32px 48px", borderTop: "1px solid #E2D5C8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <Logo size="sm" asLink={false} />
        <div style={{display: "flex", gap: "24px"}}>
          <a href="/privacy" style={{fontSize: "12px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Privacy</a>
          <a href="/terms" style={{fontSize: "12px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Terms</a>
        </div>
        <p style={{fontSize: "12px", color: "#DDD0C0", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}