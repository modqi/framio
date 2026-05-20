"use client";
import { useCurrency } from "@/lib/currency-context";
import { CATEGORY_KEY } from "@/lib/categories";
import { useTranslations } from "@/lib/i18n";

export default function HomeFeaturedPhotographers({ photographers }: { photographers: any[] }) {
  const { formatPrice } = useCurrency();
  const t = useTranslations("Home");
  const tCat = useTranslations("Categories");

  if (photographers.length === 0) return null;

  return (
    <section style={{backgroundColor: "#FDFBF8", padding: "100px 48px"}}>
      <div style={{maxWidth: "1100px", margin: "0 auto"}}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "56px", flexWrap: "wrap", gap: "16px"}}>
          <div>
            <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 16px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("featured.label")}</p>
            <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: "400", color: "#1A0E06", margin: "0", letterSpacing: "-0.02em"}}>
              {t("featured.heading")}
            </h2>
          </div>
          <a href="/photographers" style={{fontSize: "13px", color: "#C8622A", textDecoration: "none", border: "1px solid rgba(184,85,40,0.3)", padding: "10px 24px", borderRadius: "999px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>
            {t("featured.viewAll")}
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {photographers.map((photographer) => (
            <a key={photographer.id} href={`/photographers/${photographer.id}`} style={{textDecoration: "none", display: "block", backgroundColor: "#FDFBF8", borderRadius: "12px", overflow: "hidden", border: "1px solid #E2D5C8", boxShadow: "0 2px 12px rgba(28,16,9,0.06)"}}>
              <div style={{height: "220px", backgroundColor: "#E2D5C8", backgroundImage: photographer.profile_photo ? "none" : "repeating-linear-gradient(-45deg,#E2D5C8,#E2D5C8 6px,#EDE3D1 6px,#EDE3D1 14px)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"}}>
                {photographer.profile_photo ? (
                  <img src={photographer.profile_photo} alt={photographer.name} style={{width: "100%", height: "100%", objectFit: "cover"}} />
                ) : (
                  <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "72px", fontWeight: "400", color: "#C8622A", opacity: 0.5}}>{photographer.name?.[0]}</span>
                )}
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
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                  <span style={{fontSize: "13px", color: "#7A5C44", fontFamily: "'Jost', sans-serif"}}>
                    <svg viewBox="0 0 64 64" width="14" height="14" fill="none" style={{display:"inline-block",verticalAlign:"middle",marginRight:"3px"}}>
                      <circle cx="32" cy="32" r="9" fill="#C8622A"/>
                      <line x1="32" y1="18" x2="32" y2="10" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="46" y1="32" x2="54" y2="32" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="42" y1="22" x2="48" y2="16" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="22" y1="22" x2="16" y2="16" stroke="#C8622A" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {photographer.rating || "New"}
                  </span>
                  <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", fontWeight: "500", color: "#1A0E06"}}>
                    {(() => {
                      const prices = (photographer.photographer_packages || []).map((p: any) => p.price).filter((n: number) => n > 0);
                      return prices.length > 0 ? formatPrice(Math.min(...prices)) : "";
                    })()}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
