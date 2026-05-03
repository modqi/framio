"use client";
import Logo from "../../components/Logo";

export default function PayoutSetupComplete() {
  return (
    <main className="min-h-screen flex flex-col" style={{backgroundColor: "#FAF7F1"}}>

      <nav style={{borderBottom: "1px solid #E4D8C4", backgroundColor: "rgba(250,247,241,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
      </nav>

      <div style={{flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 32px"}}>
        <div style={{maxWidth: "520px", width: "100%", textAlign: "center"}}>

          <div style={{width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "32px"}}>
            ✓
          </div>

          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>PAYMENT SETUP COMPLETE</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "40px", fontWeight: "400", color: "#1C1009", margin: "0 0 16px", letterSpacing: "-0.02em"}}>
            You're all set
          </h1>
          <p style={{fontSize: "14px", color: "#7A5235", margin: "0 0 40px", lineHeight: "1.8", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
            Your bank account is connected. Once clients book and pay for sessions, Lomissa will automatically transfer your earnings after deducting the 10% platform fee.
          </p>

          <div style={{backgroundColor: "#FDFBF7", borderRadius: "12px", padding: "24px", border: "1px solid #E4D8C4", marginBottom: "32px", textAlign: "left"}}>
            <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 16px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>WHAT HAPPENS NOW</p>
            {[
              "Your profile is now visible to clients on Lomissa",
              "Clients can browse, book, and pay for your sessions",
              "After each session, 90% of the fee is transferred to your bank account",
              "Payouts typically arrive within 2–7 business days",
            ].map((step, i) => (
              <div key={i} style={{display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: i < 3 ? "12px" : "0"}}>
                <span style={{fontSize: "12px", color: "#B85528", fontWeight: "600", flexShrink: 0, minWidth: "24px", fontFamily: "'Jost', sans-serif"}}>0{i + 1}</span>
                <span style={{fontSize: "14px", color: "#555", fontFamily: "'Jost', sans-serif"}}>{step}</span>
              </div>
            ))}
          </div>

          <a
            href="/photographer-dashboard"
            style={{display: "inline-block", backgroundColor: "#B85528", color: "#FAF7F1", fontSize: "13px", padding: "14px 40px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}
          >
            Go to my dashboard →
          </a>

        </div>
      </div>

      <footer style={{backgroundColor: "#FAF7F1", padding: "32px 48px", borderTop: "1px solid #E4D8C4", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#C3AB88", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}
