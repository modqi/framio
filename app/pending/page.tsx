import Logo from "../components/Logo";

export default function Pending() {
  return (
    <main className="min-h-screen flex flex-col" style={{backgroundColor: "#FAF7F1"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E4D8C4", backgroundColor: "rgba(250,247,241,0.96)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
      </nav>

      <div className="flex flex-col items-center justify-center flex-1" style={{padding: "48px 32px"}}>
        <div style={{backgroundColor: "#FDFBF7", borderRadius: "16px", padding: "48px 32px", border: "1px solid #E4D8C4", textAlign: "center", maxWidth: "480px", width: "100%"}}>
          <div style={{fontSize: "48px", marginBottom: "24px"}}>⏳</div>
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>APPLICATION UNDER REVIEW</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "400", color: "#1C1009", margin: "0 0 16px", letterSpacing: "-0.02em"}}>
            We are reviewing your application
          </h1>
          <p style={{fontSize: "14px", color: "#7A5235", margin: "0 0 32px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300"}}>
            Thank you for applying to Lomissa. Our team is reviewing your portfolio and will get back to you within 3 business days.
          </p>
          <div style={{backgroundColor: "#F5EFE4", borderRadius: "8px", padding: "16px", marginBottom: "32px", textAlign: "left"}}>
            {[
              "We review your portfolio and experience",
              "We check your Instagram and website",
              "You receive an email with our decision",
              "If approved you can log in immediately",
            ].map((step, i) => (
              <div key={i} style={{display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: i < 3 ? "10px" : "0"}}>
                <span style={{fontSize: "12px", color: "#B85528", flexShrink: 0, fontWeight: "600", fontFamily: "'Jost', sans-serif"}}>0{i + 1}</span>
                <span style={{fontSize: "13px", color: "#7A5235", fontFamily: "'Jost', sans-serif"}}>{step}</span>
              </div>
            ))}
          </div>
          <p style={{fontSize: "13px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>
            Questions? Email us at{" "}
            <a href="mailto:hello@lomissa.com" style={{color: "#B85528", textDecoration: "none"}}>hello@lomissa.com</a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#FAF7F1", padding: "32px 48px", borderTop: "1px solid #E4D8C4", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#C3AB88", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}