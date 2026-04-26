export default function Pending() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FAFAF8"}}>
      <div style={{backgroundColor: "#fff", borderRadius: "12px", padding: "48px 32px", border: "1px solid #f0f0f0", textAlign: "center", maxWidth: "480px"}}>
        <div style={{fontSize: "48px", marginBottom: "24px"}}>⏳</div>
        <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 12px", letterSpacing: "1px"}}>APPLICATION UNDER REVIEW</p>
        <h1 style={{fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 16px", letterSpacing: "-0.5px"}}>
          We are reviewing your application
        </h1>
        <p style={{fontSize: "14px", color: "#888", margin: "0 0 32px", lineHeight: "1.7"}}>
          Thank you for applying to Lomissa. Our team is reviewing your portfolio and will get back to you within 3 business days.
        </p>
        <div style={{backgroundColor: "#FDF8F5", borderRadius: "8px", padding: "16px", marginBottom: "32px", textAlign: "left"}}>
          {[
            "We review your portfolio and experience",
            "We check your Instagram and website",
            "You receive an email with our decision",
            "If approved you can log in immediately",
          ].map((step, i) => (
            <div key={i} style={{display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: i < 3 ? "10px" : "0"}}>
              <span style={{fontSize: "12px", color: "#C4907A", flexShrink: 0, fontWeight: "600"}}>0{i + 1}</span>
              <span style={{fontSize: "13px", color: "#888"}}>{step}</span>
            </div>
          ))}
        </div>
        <p style={{fontSize: "13px", color: "#888", margin: "0"}}>
          Questions? Email us at{" "}
          <a href="mailto:hello@lomissa.com" style={{color: "#C4907A", textDecoration: "none"}}>hello@lomissa.com</a>
        </p>
      </div>
    </main>
  );
}