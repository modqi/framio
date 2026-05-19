"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Logo from "../components/Logo";
import GlobeModal from "../components/GlobeModal";
import AuthModal from "../components/AuthModal";
import { useCurrency } from "../../lib/currency-context";
import { useTranslations } from "../../lib/i18n";
import { CATEGORIES, CATEGORY_KEY } from "../../lib/categories";

const SPECIALTIES = ["All", ...CATEGORIES] as const;

export default function Photographers() {
  const { formatPrice } = useCurrency();
  const t = useTranslations("Browse");
  const tCat = useTranslations("Categories");
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [specialty, setSpecialty] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [authUser, setAuthUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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

  // When availability date changes, fetch blocked photographer IDs for that date
  useEffect(() => {
    if (!availabilityDate) {
      setBlockedIds(new Set());
      return;
    }
    const fetchBlocked = async () => {
      const { data } = await supabase
        .from("availability")
        .select("photographer_id")
        .eq("date", availabilityDate)
        .eq("is_available", false);
      setBlockedIds(new Set((data || []).map((r: any) => r.photographer_id)));
    };
    fetchBlocked();
  }, [availabilityDate]);

  useEffect(() => {
    let results = [...photographers];

    if (search) {
      results = results.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.specialty?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (locationFilter) {
      results = results.filter(p =>
        p.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (availabilityDate) {
      results = results.filter(p => !blockedIds.has(p.user_id));
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
  }, [search, locationFilter, specialty, sortBy, photographers, availabilityDate, blockedIds]);

  const clearAllFilters = () => {
    setSearch("");
    setLocationFilter("");
    setAvailabilityDate("");
    setSpecialty("All");
    setSortBy("newest");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FDFBF8"}}>
      <p style={{fontSize: "13px", color: "#C8622A", fontFamily: "'Jost', sans-serif"}}>Loading...</p>
    </div>
  );

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Logo size="sm" />
        <div className="flex items-center gap-2 sm:gap-4">
          <GlobeModal />
          {authUser ? (
            <>
              <span className="hidden sm:inline" style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>
                {authUser.user_metadata?.name?.split(" ")[0] || "Hi"}
              </span>
              <a
                href={authUser.user_metadata?.role === "admin" ? "/admin" : authUser.user_metadata?.role === "photographer" ? "/photographer-dashboard" : "/dashboard"}
                style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "8px 14px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500", whiteSpace: "nowrap"}}
              >
                {authUser.user_metadata?.role === "admin" ? t("nav.adminPanel") : t("nav.myDashboard")}
              </a>
            </>
          ) : (
            <>
              <button onClick={() => setAuthModalOpen(true)} style={{backgroundColor: "#1A0E06", color: "#FDFBF8", border: "none", cursor: "pointer", fontSize: "13px", padding: "8px 14px", borderRadius: "999px", fontFamily: "'Jost', sans-serif", fontWeight: "500", whiteSpace: "nowrap"}}>{t("nav.logInOrSignUp")}</button>
              <a href="/signup?role=photographer" className="hidden sm:inline" style={{border: "1px solid #C8622A", color: "#C8622A", backgroundColor: "transparent", fontSize: "13px", padding: "8px 14px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500", whiteSpace: "nowrap"}}>{t("nav.joinAsPhotographer")}</a>
            </>
          )}
        </div>
      </nav>

      {/* Header */}
      <section style={{backgroundColor: "#FDFBF8", padding: "48px 48px 32px", borderBottom: "1px solid #E2D5C8"}}>
        <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("header.label")}</p>
        <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: "400", color: "#1A0E06", margin: "0 0 32px", letterSpacing: "-0.02em"}}>
          {t("header.heading")}
        </h1>

        {/* Name / specialty search bar */}
        <div style={{position: "relative", maxWidth: "560px", marginBottom: "16px"}}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search.placeholder")}
            style={{width: "100%", border: "1px solid #E2D5C8", borderRadius: "999px", padding: "12px 24px", paddingLeft: "48px", fontSize: "14px", outline: "none", color: "#1A0E06", backgroundColor: "#FDFBF8", boxSizing: "border-box", fontFamily: "'Jost', sans-serif"}}
          />
          <span style={{position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)"}}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#7A5C44" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg></span>
          {search && (
            <button onClick={() => setSearch("")} style={{position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#7A5C44"}}>✕</button>
          )}
        </div>

        {/* Location + Availability filters */}
        <div style={{display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px", alignItems: "center"}}>
          {/* Location */}
          <div style={{position: "relative", minWidth: "200px"}}>
            <span style={{position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none"}}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#7A5C44" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
            </span>
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder={t("filter.locationPlaceholder" as any)}
              style={{border: "1px solid #E2D5C8", borderRadius: "999px", padding: "8px 36px 8px 34px", fontSize: "13px", outline: "none", color: "#1A0E06", backgroundColor: "#FDFBF8", fontFamily: "'Jost', sans-serif", width: "100%", boxSizing: "border-box"}}
            />
            {locationFilter && (
              <button onClick={() => setLocationFilter("")} style={{position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "#7A5C44", padding: "0", lineHeight: "1"}}>✕</button>
            )}
          </div>

          {/* Availability date */}
          <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
            <span style={{fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", whiteSpace: "nowrap"}}>{t("filter.availability" as any)}</span>
            <input
              type="date"
              value={availabilityDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setAvailabilityDate(e.target.value)}
              style={{border: "1px solid #E2D5C8", borderRadius: "999px", padding: "7px 16px", fontSize: "13px", outline: "none", color: availabilityDate ? "#1A0E06" : "#7A5C44", backgroundColor: availabilityDate ? "#FBF0EA" : "#FDFBF8", fontFamily: "'Jost', sans-serif", cursor: "pointer", borderColor: availabilityDate ? "#C8622A" : "#E2D5C8"}}
            />
            {availabilityDate && (
              <button onClick={() => setAvailabilityDate("")} style={{fontSize: "12px", color: "#7A5C44", background: "none", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif", padding: "0", textDecoration: "underline"}}>
                {t("filter.clearDate" as any)}
              </button>
            )}
          </div>
        </div>

        {/* Specialty filters */}
        <div style={{display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px"}}>
          {SPECIALTIES.map((s) => (
            <button
              key={s}
              onClick={() => setSpecialty(s)}
              style={{padding: "6px 16px", borderRadius: "999px", border: specialty === s ? "1px solid #C8622A" : "1px solid #E2D5C8", backgroundColor: specialty === s ? "#C8622A" : "#FDFBF8", color: specialty === s ? "#FDFBF8" : "#7A5C44", fontSize: "12px", cursor: "pointer", fontWeight: specialty === s ? "500" : "400", fontFamily: "'Jost', sans-serif", letterSpacing: "0.03em"}}
            >
              {s === "All" ? tCat("all") : tCat(CATEGORY_KEY[s])}
            </button>
          ))}
        </div>

        {/* Sort + count */}
        <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
          <span style={{fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>{t("sort.label")}</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{border: "1px solid #E2D5C8", borderRadius: "999px", padding: "6px 16px", fontSize: "12px", outline: "none", backgroundColor: "#FDFBF8", color: "#1A0E06", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
          >
            <option value="newest">{t("sort.newest")}</option>
            <option value="rating">{t("sort.highestRated")}</option>
            <option value="price_low">{t("sort.priceLow")}</option>
            <option value="price_high">{t("sort.priceHigh")}</option>
          </select>
          <span style={{fontSize: "12px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>
            {filtered.length === 1 ? t("countSingular" as any) : t("countPlural" as any, { count: filtered.length } as any)}
          </span>
        </div>
      </section>

      {/* Photographers grid */}
      <div style={{maxWidth: "1100px", margin: "0 auto", padding: "48px 32px"}}>
        {filtered.length === 0 ? (
          <div style={{textAlign: "center", padding: "80px 0"}}>
            <div style={{marginBottom: "16px"}}><svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#C8622A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg></div>
            <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "24px", color: "#1A0E06", margin: "0 0 8px"}}>{t("noResults.heading")}</p>
            <p style={{fontSize: "14px", color: "#7A5C44", margin: "0 0 24px", fontFamily: "'Jost', sans-serif"}}>{t("noResults.description")}</p>
            <button
              onClick={clearAllFilters}
              style={{backgroundColor: "#C8622A", color: "#FDFBF8", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif"}}
            >
              {t("noResults.clear")}
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
                      <span key={cat} style={{fontSize: "10px", color: "#C8622A", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E", padding: "2px 8px", borderRadius: "999px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.03em"}}>{CATEGORY_KEY[cat] ? tCat(CATEGORY_KEY[cat]) : cat}</span>
                    ))}
                  </div>
                  <h3 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "500", color: "#1A0E06", margin: "0 0 4px"}}>{photographer.name}</h3>
                  <p style={{fontSize: "13px", color: "#7A5C44", margin: "0 0 16px", fontFamily: "'Jost', sans-serif"}}>{photographer.location}</p>
                  <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px"}}>
                    <span style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}><svg viewBox="0 0 64 64" width="14" height="14" fill="none" style={{display:"inline-block",verticalAlign:"middle",marginRight:"3px"}}><circle cx="32" cy="32" r="9" fill="#C8622A"/><line x1="32" y1="18" x2="32" y2="10" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="46" y1="32" x2="54" y2="32" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="42" y1="22" x2="48" y2="16" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/><line x1="22" y1="22" x2="16" y2="16" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/></svg>{photographer.rating || "New"}</span>
                    <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", fontWeight: "500", color: "#1A0E06"}}>
                      {(() => {
                        const prices = (photographer.photographer_packages || []).map((p: any) => p.price).filter((n: number) => n > 0);
                        return prices.length > 0 ? `${t("card.from")} ${formatPrice(Math.min(...prices))}` : "";
                      })()}
                    </span>
                  </div>
                  <div style={{display: "block", textAlign: "center", backgroundColor: "#1A0E06", color: "#FDFBF8", fontSize: "13px", padding: "10px", borderRadius: "999px", fontWeight: "500", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>
                    {t("card.viewProfile")}
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
          <a href="/privacy-policy" style={{fontSize: "12px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Privacy</a>
          <a href="/terms-of-service" style={{fontSize: "12px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Terms</a>
        </div>
        <p style={{fontSize: "12px", color: "#DDD0C0", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </main>
  );
}
