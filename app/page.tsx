import Logo from "./components/Logo";
import NavbarClient from "./components/NavbarClient";
import FooterAuthButtons from "./components/FooterAuthButtons";
import HomeFeaturedPhotographers from "./components/HomeFeaturedPhotographers";
import HomeStaticSections from "./components/HomeStaticSections";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("photographers")
    .select("*, photographer_packages(id, price)")
    .eq("stripe_onboarding_completed", true)
    .order("created_at", { ascending: false });
  const photographers = ((data || []) as any[])
    .filter((p: any) => p.photographer_packages?.length > 0)
    .slice(0, 6);

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>
      <style>{`
        @media (max-width: 767px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-left { padding: 100px 24px 60px !important; }
          .hero-right { display: none !important; }
          .hero-buttons { flex-wrap: wrap !important; justify-content: flex-start !important; }
          .trust-bar-inner { flex-direction: column !important; gap: 10px !important; text-align: center !important; }
          .trust-bar-dot { display: none !important; }
        }
      `}</style>

      {/* Navigation */}
      <nav style={{position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Logo size="sm" />
        <div className="flex items-center gap-2 sm:gap-4">
          <NavbarClient />
        </div>
      </nav>

      {/* Hero, Trust bar, How it works — locale-aware client component */}
      <HomeStaticSections />

      {/* Featured photographers — locale-aware, receives server-fetched data */}
      <HomeFeaturedPhotographers photographers={photographers} />

      {/* Footer */}
      <footer style={{backgroundColor: "#FDFBF8", padding: "48px", borderTop: "1px solid #E2D5C8"}}>
        <div style={{maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "32px"}}>
          <div>
            <Logo size="md" asLink={false} />
            <p style={{fontSize: "12px", color: "#7A5C44", margin: "16px 0 0", maxWidth: "280px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>The photography marketplace connecting clients with hand-picked photographers worldwide.</p>
          </div>
          <div style={{display: "flex", gap: "48px", flexWrap: "wrap"}}>
            <div>
              <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>PLATFORM</p>
              <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <a href="/photographers" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Find photographers</a>
                <FooterAuthButtons />
              </div>
            </div>
            <div>
              <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>LEGAL</p>
              <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <a href="/privacy-policy" rel="noopener" style={{fontSize: "13px", color: "#C8622A", textDecoration: "underline", fontFamily: "'Jost', sans-serif", fontWeight: "400"}}>Privacy Policy</a>
                <a href="/terms-of-service" rel="noopener" style={{fontSize: "13px", color: "#C8622A", textDecoration: "underline", fontFamily: "'Jost', sans-serif", fontWeight: "400"}}>Terms of Service</a>
              </div>
            </div>
            <div>
              <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>PHOTOGRAPHERS</p>
              <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <a href="/signup?role=photographer" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>Apply to join</a>
                <a href="mailto:hello@lomissa.com" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>hello@lomissa.com</a>
              </div>
            </div>
          </div>
        </div>
        <div style={{maxWidth: "1100px", margin: "32px auto 0", paddingTop: "32px", borderTop: "1px solid #E2D5C8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"}}>
          <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
          <p style={{fontSize: "12px", color: "#DDD0C0", margin: "0", fontFamily: "'Jost', sans-serif"}}>Made with ❤️ for photographers everywhere</p>
        </div>
        <div style={{maxWidth: "1100px", margin: "20px auto 0", paddingTop: "20px", borderTop: "1px solid #F0EAE0"}}>
          <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>When you sign in with Google, we access your name and email address to create your Lomissa account. We do not access your Gmail, contacts, or any other Google services.</p>
        </div>
      </footer>
    </main>
  );
}
