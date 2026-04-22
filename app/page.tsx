"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase
        .from("photographers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      setPhotographers(data || []);
      setLoading(false);
    };
    getData();
  }, []);

  return (
    <main className="min-h-screen" style={{backgroundColor: "#fff"}}>

      {/* Navigation */}
      <nav style={{position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, borderBottom: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(26,26,26,0.95)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <span style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#fff", letterSpacing: "-1px"}}>Lomissa</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/photographers" style={{color: "rgba(255,255,255,0.7)", fontSize: "13px", textDecoration: "none"}}>Photographers</a>
          <a href="/join" style={{color: "rgba(255,255,255,0.7)", fontSize: "13px", textDecoration: "none"}}>Join as photographer</a>
          <a href="/login" style={{color: "rgba(255,255,255,0.7)", fontSize: "13px", textDecoration: "none"}}>Log in</a>
          <a href="/signup" style={{backgroundColor: "#C4907A", color: "#fff", fontSize: "13px", padding: "8px 20px", borderRadius: "24px", textDecoration: "none", fontWeight: "600"}}>Sign up</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{minHeight: "100vh", backgroundColor: "#1a1a1a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 48px 80px", textAlign: "center", position: "relative", overflow: "hidden"}}>

        {/* Background pattern */}
        <div style={{position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(196,144,122,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(196,144,122,0.1) 0%, transparent 40%)", pointerEvents: "none"}}/>

        <div style={{position: "relative", zIndex: 1, maxWidth: "800px"}}>
          <div style={{display: "inline-block", backgroundColor: "rgba(196,144,122,0.2)", border: "1px solid rgba(196,144,122,0.4)", borderRadius: "24px", padding: "6px 16px", marginBottom: "32px"}}>
            <p style={{fontSize: "12px", color: "#C4907A", margin: "0", letterSpacing: "1px"}}>🌍 Now launching worldwide</p>
          </div>

          <h1 style={{fontFamily: "Georgia, serif", fontSize: "clamp(40px, 7vw, 80px)", fontWeight: "700", color: "#fff", margin: "0 0 24px", letterSpacing: "-2px", lineHeight: "1.05"}}>
            Join the photography<br/>marketplace launching<br/>worldwide
          </h1>

          <p style={{fontSize: "clamp(16px, 2vw, 20px)", color: "rgba(255,255,255,0.6)", margin: "0 0 48px", lineHeight: "1.7", maxWidth: "560px", marginLeft: "auto", marginRight: "auto"}}>
            Lomissa connects clients with hand-picked photographers for portraits, weddings, events and more. Book in minutes.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="/photographers" style={{backgroundColor: "#C4907A", color: "#fff", fontSize: "15px", padding: "16px 40px", borderRadius: "8px", textDecoration: "none", fontWeight: "600"}}>
              Find a photographer
            </a>
            <a href="/join" style={{backgroundColor: "transparent", color: "#fff", fontSize: "15px", padding: "16px 40px", borderRadius: "8px", textDecoration: "none", fontWeight: "600", border: "1px solid rgba(255,255,255,0.3)"}}>
              Join as photographer
            </a>
          </div>

          <p style={{fontSize: "12px", color: "rgba(255,255,255,0.3)", margin: "24px 0 0"}}>
            Free to join · 10% commission only · Hand-picked photographers
          </p>
        </div>

        {/* Scroll indicator */}
        <div style={{position: "absolute", bottom: "40px", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px"}}>
          <p style={{fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: "0", letterSpacing: "2px"}}>SCROLL</p>
          <div style={{width: "1px", height: "40px", backgroundColor: "rgba(255,255,255,0.2)"}}/>
        </div>
      </section>

      {/* How it works */}
      <section style={{backgroundColor: "#fff", padding: "80px 48px"}}>
        <div style={{maxWidth: "1000px", margin: "0 auto"}}>
          <div style={{textAlign: "center", marginBottom: "64px"}}>
            <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 12px", letterSpacing: "1px"}}>HOW IT WORKS</p>
            <h2 style={{fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: "700", color: "#1a1a1a", margin: "0", letterSpacing: "-1px"}}>
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
                <p style={{fontFamily: "Georgia, serif", fontSize: "48px", fontWeight: "700", color: "#f0f0f0", margin: "0 0 16px", letterSpacing: "-2px"}}>{step.number}</p>
                <h3 style={{fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 12px"}}>{step.title}</h3>
                <p style={{fontSize: "14px", color: "#888", margin: "0", lineHeight: "1.8"}}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured photographers */}
      {photographers.length > 0 && (
        <section style={{backgroundColor: "#FAFAF8", padding: "80px 48px"}}>
          <div style={{maxWidth: "1100px", margin: "0 auto"}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "48px", flexWrap: "wrap", gap: "16px"}}>
              <div>
                <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 12px", letterSpacing: "1px"}}>OUR PHOTOGRAPHERS</p>
                <h2 style={{fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: "700", color: "#1a1a1a", margin: "0", letterSpacing: "-1px"}}>
                  Hand-picked talent
                </h2>
              </div>
              <a href="/photographers" style={{fontSize: "13px", color: "#C4907A", textDecoration: "none", border: "1px solid #f0e8e0", padding: "10px 24px", borderRadius: "24px"}}>
                View all →
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {photographers.map((photographer) => (
                <a key={photographer.id} href={`/photographers/${photographer.id}`} style={{textDecoration: "none", display: "block", backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden", border: "1px solid #f0f0f0", boxShadow: "0 2px 16px rgba(0,0,0,0.04)"}}>
                  <div style={{height: "200px", backgroundColor: "#FDF8F5", display: "flex", alignItems: "center", justifyContent: "center"}}>
                    <span style={{fontFamily: "Georgia, serif", fontSize: "64px", fontWeight: "700", color: "#C4907A"}}>{photographer.name?.[0]}</span>
                  </div>
                  <div style={{padding: "24px"}}>
                    <p style={{fontSize: "11px", color: "#C4907A", margin: "0 0 6px", letterSpacing: "1px"}}>{photographer.specialty}</p>
                    <h3 style={{fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px"}}>{photographer.name}</h3>
                    <p style={{fontSize: "13px", color: "#888", margin: "0 0 16px"}}>{photographer.location}</p>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                      <span style={{fontSize: "13px", color: "#888"}}>⭐ {photographer.rating || "New"}</span>
                      <span style={{fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: "700", color: "#1a1a1a"}}>{photographer.price}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* For photographers */}
      <section style={{backgroundColor: "#1a1a1a", padding: "80px 48px"}}>
        <div style={{maxWidth: "800px", margin: "0 auto", textAlign: "center"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 16px", letterSpacing: "1px"}}>FOR PHOTOGRAPHERS</p>
          <h2 style={{fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: "700", color: "#fff", margin: "0 0 24px", letterSpacing: "-1px", lineHeight: "1.1"}}>
            Are you a photographer?<br/>Join Lomissa today.
          </h2>
          <p style={{fontSize: "16px", color: "rgba(255,255,255,0.6)", margin: "0 0 48px", lineHeight: "1.8", maxWidth: "480px", marginLeft: "auto", marginRight: "auto"}}>
            We are hand-picking talented photographers to join our marketplace. Apply now and start receiving bookings from clients around the world.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { value: "Free", label: "To join Lomissa" },
              { value: "10%", label: "Commission only" },
              { value: "3 days", label: "Average response" },
            ].map((stat) => (
              <div key={stat.label} style={{textAlign: "center"}}>
                <p style={{fontFamily: "Georgia, serif", fontSize: "36px", fontWeight: "700", color: "#C4907A", margin: "0 0 4px"}}>{stat.value}</p>
                <p style={{fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: "0"}}>{stat.label}</p>
              </div>
            ))}
          </div>

          <a href="/join" style={{backgroundColor: "#C4907A", color: "#fff", fontSize: "15px", padding: "16px 48px", borderRadius: "8px", textDecoration: "none", fontWeight: "600", display: "inline-block"}}>
            Apply to join
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{backgroundColor: "#fff", padding: "48px", borderTop: "1px solid #f0f0f0"}}>
        <div style={{maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "32px"}}>
          <div>
            <p style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>Lomissa</p>
            <p style={{fontSize: "12px", color: "#888", margin: "0", maxWidth: "280px", lineHeight: "1.7"}}>The photography marketplace connecting clients with hand-picked photographers worldwide.</p>
          </div>
          <div style={{display: "flex", gap: "48px", flexWrap: "wrap"}}>
            <div>
              <p style={{fontSize: "11px", color: "#C4907A", margin: "0 0 12px", letterSpacing: "1px"}}>PLATFORM</p>
              <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <a href="/photographers" style={{fontSize: "13px", color: "#888", textDecoration: "none"}}>Find photographers</a>
                <a href="/join" style={{fontSize: "13px", color: "#888", textDecoration: "none"}}>Join as photographer</a>
                <a href="/signup" style={{fontSize: "13px", color: "#888", textDecoration: "none"}}>Create account</a>
              </div>
            </div>
            <div>
              <p style={{fontSize: "11px", color: "#C4907A", margin: "0 0 12px", letterSpacing: "1px"}}>ACCOUNT</p>
              <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <a href="/login" style={{fontSize: "13px", color: "#888", textDecoration: "none"}}>Log in</a>
                <a href="/dashboard" style={{fontSize: "13px", color: "#888", textDecoration: "none"}}>My bookings</a>
                <a href="/photographer-dashboard" style={{fontSize: "13px", color: "#888", textDecoration: "none"}}>Photographer dashboard</a>
              </div>
            </div>
          </div>
        </div>
        <div style={{maxWidth: "1100px", margin: "32px auto 0", paddingTop: "32px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"}}>
          <p style={{fontSize: "12px", color: "#aaa", margin: "0"}}>© 2026 Lomissa. All rights reserved.</p>
          <div style={{display: "flex", gap: "24px"}}>
  <a href="/privacy" style={{fontSize: "12px", color: "#aaa", textDecoration: "none"}}>Privacy Policy</a>
  <a href="/terms" style={{fontSize: "12px", color: "#aaa", textDecoration: "none"}}>Terms of Service</a>
</div>
        </div>
      </footer>

    </main>
  );
}