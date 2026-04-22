export default function Terms() {
  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAFAF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>Lomissa</a>
        </div>
        <a href="/" style={{fontSize: "12px", color: "#888", textDecoration: "none"}}>Back to home</a>
      </nav>

      <div style={{maxWidth: "720px", margin: "0 auto", padding: "64px 32px"}}>

        <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 12px", letterSpacing: "1px"}}>Legal</p>
        <h1 style={{fontFamily: "Georgia, serif", fontSize: "40px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>Terms of Service</h1>
        <p style={{fontSize: "13px", color: "#888", margin: "0 0 48px"}}>Last updated: April 2026</p>

        {[
          {
            title: "Acceptance of terms",
            content: "By accessing or using Lomissa at lomissa.com you agree to be bound by these Terms of Service. If you do not agree to these terms please do not use the platform. These terms apply to all users including clients who book photographers and photographers who offer their services."
          },
          {
            title: "What Lomissa is",
            content: "Lomissa is a marketplace that connects clients with professional photographers. We are not a photography agency. We do not employ photographers. Lomissa provides the platform and technology that enables clients and photographers to connect, communicate and complete bookings. The photography services themselves are provided by independent photographers."
          },
          {
            title: "Creating an account",
            content: "You must be at least 18 years old to create an account on Lomissa. You are responsible for keeping your account credentials secure. You must provide accurate and truthful information when creating your account. You may not create an account on behalf of another person without their permission."
          },
          {
            title: "For clients",
            content: "When you book a photographer through Lomissa you agree to pay the session fee displayed at the time of booking. Payment is processed securely through Stripe. You agree to attend your booked session at the agreed time and location. Cancellation policies are agreed between you and the photographer. Lomissa charges a 10% service fee on all bookings."
          },
          {
            title: "For photographers",
            content: "By applying and being accepted to Lomissa you agree to provide professional photography services to clients who book you. You agree to respond to booking requests within 24 hours. You agree to attend all confirmed sessions. Lomissa charges a 10% commission on all bookings made through the platform. You retain full ownership and copyright of all photos you take."
          },
          {
            title: "Payments and commission",
            content: "All payments are processed through Stripe. Lomissa charges a 10% commission on every booking. This commission covers the cost of operating the platform, payment processing, and customer support. Photographers receive 90% of the session fee. Payments to photographers are processed after the session is confirmed complete."
          },
          {
            title: "Cancellations and refunds",
            content: "Cancellation policies are set by each photographer and displayed on their profile. If a photographer cancels a confirmed booking the client will receive a full refund. If a client cancels a booking the photographer's cancellation policy applies. Lomissa is not responsible for disputes between clients and photographers regarding cancellations."
          },
          {
            title: "Reviews",
            content: "Clients may leave a review after a confirmed and completed booking. Reviews must be honest and based on genuine experience. Lomissa reserves the right to remove reviews that contain false information, hate speech, or content that violates these terms. Photographers may not offer incentives in exchange for positive reviews."
          },
          {
            title: "Content and photos",
            content: "Photographers retain full copyright ownership of all photos they take. By uploading photos to Lomissa you grant us a licence to display them on the platform for the purpose of promoting your profile. Clients may not reproduce or redistribute photos without the photographer's permission. All portfolio photos uploaded to Lomissa must be your own original work."
          },
          {
            title: "Prohibited conduct",
            content: "You may not use Lomissa to conduct transactions outside the platform to avoid commission fees. You may not post false or misleading information on your profile. You may not harass, threaten or discriminate against other users. You may not attempt to reverse engineer or copy the Lomissa platform. Violation of these rules may result in immediate account termination."
          },
          {
            title: "Limitation of liability",
            content: "Lomissa provides the platform as a marketplace and is not responsible for the quality of photography services provided by photographers. We are not liable for any disputes between clients and photographers. Our liability is limited to the amount of fees paid to Lomissa in the three months prior to any claim."
          },
          {
            title: "Governing law",
            content: "These terms are governed by the laws of Norway. Any disputes arising from these terms or your use of Lomissa shall be subject to the jurisdiction of Norwegian courts."
          },
          {
            title: "Contact us",
            content: "If you have any questions about these Terms of Service please contact us at hello@lomissa.com. We aim to respond to all enquiries within 48 hours."
          },
        ].map((section) => (
          <div key={section.title} style={{marginBottom: "40px"}}>
            <h2 style={{fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 12px"}}>{section.title}</h2>
            <p style={{fontSize: "15px", color: "#555", margin: "0", lineHeight: "1.9"}}>{section.content}</p>
          </div>
        ))}

      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#fff", padding: "32px 48px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"}}>
        <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0"}}>Lomissa</p>
        <div style={{display: "flex", gap: "24px"}}>
          <a href="/privacy" style={{fontSize: "12px", color: "#888", textDecoration: "none"}}>Privacy Policy</a>
          <a href="/terms" style={{fontSize: "12px", color: "#C4907A", textDecoration: "none"}}>Terms of Service</a>
        </div>
        <p style={{fontSize: "12px", color: "#888", margin: "0"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}