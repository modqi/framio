"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import Logo from "../../components/Logo";

type Step = "loading" | "scan" | "success";

export default function MfaSetup() {
  const [step, setStep] = useState<Step>("loading");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.user_metadata?.role !== "admin") {
        window.location.href = "/login";
        return;
      }

      // Skip setup if a verified factor already exists
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp?.find((f: any) => f.status === "verified");
      if (verified) {
        window.location.href = "/admin";
        return;
      }

      // Clean up any abandoned unverified factor from a previous interrupted session
      const unverified = factors?.totp?.find((f: any) => f.status === "unverified");
      if (unverified) {
        await supabase.auth.mfa.unenroll({ factorId: unverified.id });
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Lomissa",
        friendlyName: "Admin",
      });

      if (enrollError || !data) {
        setError("Failed to start MFA setup. Please refresh and try again.");
        setStep("scan");
        return;
      }

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep("scan");
    };
    init();
  }, []);

  const handleVerify = async () => {
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setError("Please enter a valid 6-digit code.");
      return;
    }
    setVerifying(true);
    setError("");

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: trimmed,
    });

    if (verifyError) {
      setError("Invalid code. Check your authenticator app and try again.");
      setCode("");
      setVerifying(false);
      return;
    }

    setStep("success");
    setTimeout(() => { window.location.href = "/admin"; }, 2000);
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FDFBF8" }}>
        <p style={{ fontSize: "13px", color: "#C8622A", fontFamily: "'Jost', sans-serif" }}>Setting up…</p>
      </div>
    );
  }

  if (step === "success") {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FDFBF8" }}>
        <div style={{ maxWidth: "480px", width: "100%", padding: "0 24px", textAlign: "center" }}>
          <div style={{ marginBottom: "32px" }}><Logo size="sm" /></div>
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "40px", border: "1px solid #E2D5C8" }}>
            <div style={{ margin: "0 auto 24px", width: "48px", height: "48px", backgroundColor: "#f0fdf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{ fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500" }}>SETUP COMPLETE</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "28px", fontWeight: "400", color: "#1A0E06", margin: "0 0 12px" }}>
              MFA activated
            </h2>
            <p style={{ fontSize: "14px", color: "#7A5C44", margin: "0 0 28px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300" }}>
              Your admin account is now protected. You&apos;ll be asked for an authenticator code on every login.
            </p>
            <a href="/admin" style={{ fontSize: "13px", color: "#C8622A", fontFamily: "'Jost', sans-serif", textDecoration: "none" }}>
              Go to admin panel →
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FDFBF8" }}>
      <nav style={{ borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)", padding: "16px 32px" }}>
        <Logo size="sm" />
      </nav>

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "64px 24px" }}>
        <p style={{ fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500" }}>
          ADMIN SECURITY SETUP
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#1A0E06", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          Secure your admin account
        </h1>
        <p style={{ fontSize: "14px", color: "#7A5C44", margin: "0 0 40px", lineHeight: "1.7", fontFamily: "'Jost', sans-serif", fontWeight: "300" }}>
          Set up two-factor authentication to protect admin access. You&apos;ll need your authenticator app on every login.
        </p>

        {/* QR code card */}
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "32px", border: "1px solid #E2D5C8", marginBottom: "16px" }}>
          <p style={{ fontSize: "11px", color: "#C8622A", margin: "0 0 20px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500" }}>
            SCAN WITH MICROSOFT AUTHENTICATOR
          </p>

          {qrCode && (
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <img
                src={qrCode}
                alt="MFA QR code"
                style={{ width: "200px", height: "200px", borderRadius: "8px", border: "1px solid #E2D5C8" }}
              />
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#E2D5C8" }} />
            <span style={{ fontSize: "11px", color: "#DDD0C0", fontFamily: "'Jost', sans-serif" }}>or enter manually</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#E2D5C8" }} />
          </div>

          <div style={{ backgroundColor: "#FDFBF8", borderRadius: "8px", padding: "14px 16px", border: "1px solid #E2D5C8", textAlign: "center" }}>
            <p style={{ fontSize: "11px", color: "#7A5C44", margin: "0 0 6px", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em" }}>SECRET KEY</p>
            <p style={{ fontSize: "13px", color: "#C8622A", fontFamily: "monospace", letterSpacing: "0.12em", margin: "0", wordBreak: "break-all" }}>
              {secret}
            </p>
          </div>
        </div>

        {/* Verify card */}
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "32px", border: "1px solid #E2D5C8" }}>
          <p style={{ fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500" }}>
            ENTER VERIFICATION CODE
          </p>
          <p style={{ fontSize: "14px", color: "#7A5C44", margin: "0 0 24px", lineHeight: "1.6", fontFamily: "'Jost', sans-serif", fontWeight: "300" }}>
            Open your authenticator app and enter the 6-digit code to confirm setup.
          </p>

          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={e => e.key === "Enter" && handleVerify()}
              autoFocus
              placeholder="000000"
              style={{ width: "160px", textAlign: "center", fontSize: "28px", letterSpacing: "0.25em", fontFamily: "monospace", border: "1px solid #E2D5C8", borderRadius: "12px", padding: "16px", backgroundColor: "#FDFBF8", outline: "none", color: "#1A0E06" }}
            />
          </div>

          {error && (
            <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "#FBF0EA", border: "1px solid #E8A97E" }}>
              <p style={{ fontSize: "13px", color: "#8F3A14", margin: "0", fontFamily: "'Jost', sans-serif" }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={verifying || code.length !== 6}
            style={{ width: "100%", backgroundColor: code.length === 6 ? "#C8622A" : "#E2D5C8", color: "#FDFBF8", fontSize: "14px", padding: "14px", border: "none", borderRadius: "999px", cursor: verifying || code.length !== 6 ? "not-allowed" : "pointer", fontWeight: "500", fontFamily: "'Jost', sans-serif", letterSpacing: "0.05em", transition: "background-color 0.15s" }}
          >
            {verifying ? "Confirming…" : "Confirm & activate"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <a href="/login" style={{ fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif" }}>
            Back to login
          </a>
        </div>
      </div>
    </main>
  );
}
