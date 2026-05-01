"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { LomissaLogo } from "./components/Logo";

export default function Home() {
  const [photographers, setPhotographers] = useState<any[]>([]);

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase
        .from("photographers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      setPhotographers(data || []);
    };
    getData();
  }, []);

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAF7F1"}}>

      {/* Navigation */}
      <nav style={{position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, borderBottom: "1px solid #E4D8C4", backgroundColor: "rgba(250,247,241,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <a href="/" style={{textDecoration: "none"}}>
          <LomissaLogo width={100}/>
        </a>
        <div className="flex items-center gap-6">
          <a href="/photographers" style={{color: "#7A5235", fontSize: "13px", textDecoration: "none", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>Photographers</a>
          <a href="/login" style={{color: "#7A5235", fontSize: "13px", textDecoration: "none", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>Log in</a>
          <a href="/signup" style={{backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "13px", padding: "8px 20px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500", letterSpacing: "0.05em"}}>Sign up</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{minHeight: "100vh", backgroundColor: "#FAF7F1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 48px 80px", textAlign: "center", position: "relative", overflow: "hidden"}}>
        <div style={{position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(184,85,40,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(193,98,47,0.04) 0%, transparent 40%)", pointerEvents: "none"}}/>
        <div style={{position: "relative", zIndex: 1, maxWidth: "800px"}}>
          <div style={{display: "inline-block", backgroundColor: "rgba(184,85,40,0.08)", border: "1px solid rgba(184,85,40,0.2)", borderRadius: "999px", padding: "6px 16px", marginBottom: "40px"}}>
            <p style={{fontSize: "12px", color: "#B85528", margin: "0", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>NOW LAUNCHING WORLDWIDE</p>
          </div>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(44px, 7vw, 84px)", fontWeight: "400", color: "#1C1009", margin: "0 0 24px", letterSpacing: "-0.02em", lineHeight: "1.05"}}>
            Your moment deserves<br/>the perfect photographer
          </h1>
          <p style={{fontSize: "clamp(15px, 2vw, 18px)", color: "#7A5235", margin: "0 0 52px", lineHeight: "1.8", maxWidth: "520px", marginLeft: "auto", marginRight: "auto", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
            Lomissa connects you with hand-picked photographers for portraits, weddings, events and more.
          </p>
          <a href="/photographers" style={{backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "15px", padding: "16px 44px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500", letterSpacing: "0.05em", boxShadow: "0 4px 20px rgba(184,85,40,0.35)"}}>
            Find a photographer
          </a>
          <p style={{fontSize: "12px", color: "#C3AB88", margin: "28px 0 0", letterSpacing: "0.1em", fontFamily: "'Jost', sans-serif"}}>
            HAND-PICKED · INSTANT BOOKING · SECURE PAYMENTS
          </p>
        </div>
      </section>

      {/* How it works */}
      <section style={{backgroundColor: "#F5EFE4", padding: "100px 48px"}}>
        <div style={{maxWidth: "1000px", margin: "0 auto"}}>
          <div style={{textAlign: "center", marginBottom: "72px"}}>
            <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 16px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>HOW IT WORKS</p>
            <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: "400", color: "#1C1009", margin: "0", letterSpacing: "-0.02em"}}>
              Book a photographer in minutes
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { number: "01", title: "Browse photographers", desc: "Explore hand-picked photographers and find the perfect match for your style and budget." },
              { number: "02", title: "Book instantly", desc: "See real availability, pick a date that works and book in minutes. No back and forth." },
              { number: "03", title: "Get your photos", desc: "Have your session and receive your professionally edited photos through Lomissa." },
            ].map((step) => (
              <div key={step.number}>
                <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "56px", fontWeight: "300", color: "#E4D8C4", margin: "0 0 20px", letterSpacing: "-0.04em", lineHeight: "1"}}>{step.number}</p>
                <h3 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "500", color: "#1C1009", margin: "0 0 12px"}}>{step.title}</h3>
                <p style={{fontSize: "14px", color: "#7A5235", margin: "0", lineHeight: "1.8", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured photographers */}
      {photographers.length > 0 && (
        <section style={{backgroundColor: "#FAF7F1", padding: "100px 48px"}}>
          <div style={{maxWidth: "1100px", margin: "0 auto"}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "56px", flexWrap: "wrap", gap: "16px"}}>
              <div>
                <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 16px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>OUR PHOTOGRAPHERS</p>
                <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: "400", color: "#1C1009", margin: "0", letterSpacing: "-0.02em"}}>
                  Hand-picked talent
                </h2>
              </div>
              <a href="/photographers" style={{fontSize: "13px", color: "#B85528", textDecoration: "none", border: "1px solid rgba(184,85,40,0.3)", padding: "10px 24px", borderRadius: "999px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em"}}>
                View all →
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {photographers.map((photographer) => (
                <a key={photographer.id} href={`/photographers/${photographer.id}`} style={{textDecoration: "none", display: "block", backgroundColor: "#FDFBF7", borderRadius: "12px", overflow: "hidden", border: "1px solid #E4D8C4", boxShadow: "0 2px 12px rgba(28,16,9,0.06)"}}>
                  <div style={{height: "220px", backgroundColor: "#E4D8C4", backgroundImage: "repeating-linear-gradient(-45deg,#E4D8C4,#E4D8C4 6px,#EDE3D1 6px,#EDE3D1 14px)", display: "flex", alignItems: "center", justifyContent: "center"}}>
                    <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "72px", fontWeight: "400", color: "#B85528", opacity: 0.5}}>{photographer.name?.[0]}</span>
                  </div>
                  <div style={{padding: "24px"}}>
                    <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 6px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{photographer.specialty}</p>
                    <h3 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "500", color: "#1C1009", margin: "0 0 4px"}}>{photographer.name}</h3>
                    <p style={{fontSize: "13px", color: "#9E7250", margin: "0 0 16px", fontFamily: "'Jost', sans-serif"}}>{photographer.location}</p>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                      <span style={{fontSize: "13px", color: "#9E7250", fontFamily: "'Jost', sans-serif"}}>⭐ {photographer.rating || "New"}</span>
                      <span style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", fontWeight: "500", color: "#1C1009"}}>{photographer.price}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust section */}
      <section style={{backgroundColor: "#F5EFE4", padding: "100px 48px"}}>
        <div style={{maxWidth: "800px", margin: "0 auto", textAlign: "center"}}>
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 16px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>WHY LOMISSA</p>
          <h2 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: "400", color: "#1C1009", margin: "0 0 56px", letterSpacing: "-0.02em", lineHeight: "1.1"}}>
            Every photographer is hand-picked
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: "✓", title: "Vetted professionals", desc: "Every photographer on Lomissa goes through a personal review process. Only the best make it." },
              { icon: "📅", title: "Instant booking", desc: "See real availability and book in seconds. No waiting, no back and forth emails." },
              { icon: "⭐", title: "Verified reviews", desc: "Every review comes from a real client who completed a real session. No fake ratings." },
            ].map((item) => (
              <div key={item.title}>
                <div style={{width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "#FAF7F1", border: "1px solid #E4D8C4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", margin: "0 auto 20px"}}>
                  {item.icon}
                </div>
                <h3 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "20px", fontWeight: "500", color: "#1C1009", margin: "0 0 12px"}}>{item.title}</h3>
                <p style={{fontSize: "14px", color: "#7A5235", margin: "0", lineHeight: "1.8", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{backgroundColor: "#FAF7F1", padding: "48px", borderTop: "1px solid #E4D8C4"}}>
        <div style={{maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "32px"}}>
          <div>
            <LomissaLogo width={120}/>
            <p style={{fontSize: "12px", color: "#9E7250", margin: "12px 0 0", maxWidth: "280px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>The photography marketplace connecting clients with hand-picked photographers worldwide.</p>
          </div>
          <div style={{display: "flex", gap: "48px", flexWrap: "wrap"}}>
            <div>
              <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>PLATFORM</p>
              <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <a href="/photographers" style={{fontSize: "13px", color: "#7A5235", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Find photographers</a>
                <a href="/signup" style={{fontSize: "13px", color: "#7A5235", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Create account</a>
                <a href="/login" style={{fontSize: "13px", color: "#7A5235", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Log in</a>
              </div>
            </div>
            <div>
              <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>LEGAL</p>
              <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <a href="/privacy" style={{fontSize: "13px", color: "#7A5235", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Privacy Policy</a>
                <a href="/terms" style={{fontSize: "13px", color: "#7A5235", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Terms of Service</a>
              </div>
            </div>
            <div>
              <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>PHOTOGRAPHERS</p>
              <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <a href="/join" style={{fontSize: "13px", color: "#7A5235", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Apply to join</a>
                <a href="mailto:hello@lomissa.com" style={{fontSize: "13px", color: "#7A5235", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>hello@lomissa.com</a>
              </div>
            </div>
          </div>
        </div>
        <div style={{maxWidth: "1100px", margin: "32px auto 0", paddingTop: "32px", borderTop: "1px solid #E4D8C4", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"}}>
          <p style={{fontSize: "12px", color: "#C3AB88", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
          <p style={{fontSize: "12px", color: "#C3AB88", margin: "0", fontFamily: "'Jost', sans-serif"}}>Made with ❤️ for photographers everywhere</p>
        </div>
      </footer>

    </main>
  );
}