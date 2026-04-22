export default function Privacy() {
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
        <h1 style={{fontFamily: "Georgia, serif", fontSize: "40px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>Privacy Policy</h1>
        <p style={{fontSize: "13px", color: "#888", margin: "0 0 48px"}}>Last updated: April 2026</p>

        {[
          {
            title: "Who we are",
            content: "Lomissa is a photography marketplace that connects clients with professional photographers. Our website is lomissa.com. When we refer to 'Lomissa', 'we', 'us' or 'our' in this policy, we mean the Lomissa platform operated from Norway."
          },
          {
            title: "What data we collect",
            content: "We collect information you provide directly to us when you create an account, make a booking or apply as a photographer. This includes your name, email address, location, and payment information processed securely through Stripe. We also collect photos you upload to your portfolio, booking details, messages sent through the platform, and reviews you leave."
          },
          {
            title: "How we use your data",
            content: "We use your data to operate the Lomissa platform — to process bookings, send email notifications about your bookings, display photographer profiles to potential clients, process payments securely, and improve our service. We do not sell your personal data to third parties. We do not use your data for advertising purposes."
          },
          {
            title: "Who we share your data with",
            content: "We share your data only with the services necessary to operate Lomissa. These include Supabase for secure database storage, Stripe for payment processing, Cloudinary for photo storage, and Resend for email notifications. All these services comply with GDPR and maintain strict data security standards."
          },
          {
            title: "Your rights under GDPR",
            content: "As a user in Norway or the European Union you have the right to access the personal data we hold about you, correct any inaccurate data, request deletion of your data, object to how we process your data, and request a copy of your data in a portable format. To exercise any of these rights please contact us at privacy@lomissa.com."
          },
          {
            title: "Data storage and security",
            content: "Your data is stored securely on servers located in Frankfurt, Germany through our database provider Supabase. All data is encrypted in transit and at rest. Payment information is never stored on our servers — it is handled entirely by Stripe, which is PCI DSS compliant."
          },
          {
            title: "Photos and portfolio content",
            content: "Photos you upload to your Lomissa portfolio are stored securely through Cloudinary and displayed on your public profile. You retain full ownership of all photos you upload. By uploading photos you grant Lomissa a licence to display them on the platform. You can delete your photos at any time from your dashboard."
          },
          {
            title: "Cookies",
            content: "Lomissa uses essential cookies only — these are necessary for the platform to function, such as keeping you logged in. We do not use advertising cookies or tracking cookies. We do not share cookie data with third parties."
          },
          {
            title: "Children",
            content: "Lomissa is not intended for use by anyone under the age of 18. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data please contact us immediately."
          },
          {
            title: "Changes to this policy",
            content: "We may update this privacy policy from time to time. We will notify you of any significant changes by email. The date at the top of this page shows when the policy was last updated."
          },
          {
            title: "Contact us",
            content: "If you have any questions about this privacy policy or how we handle your data please contact us at privacy@lomissa.com. We aim to respond to all privacy enquiries within 48 hours."
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
          <a href="/privacy" style={{fontSize: "12px", color: "#C4907A", textDecoration: "none"}}>Privacy Policy</a>
          <a href="/terms" style={{fontSize: "12px", color: "#888", textDecoration: "none"}}>Terms of Service</a>
        </div>
        <p style={{fontSize: "12px", color: "#888", margin: "0"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}