"use client";
import { useTranslations } from "../../lib/i18n";
import Logo from "../components/Logo";
import GlobeModal from "../components/GlobeModal";

type SectionDef =
  | { key: string; type: "body" }
  | { key: string; type: "list"; items: number }
  | { key: string; type: "contact" };

const sectionDefs: SectionDef[] = [
  { key: "s1",  type: "body"    },
  { key: "s2",  type: "list",  items: 4 },
  { key: "s3",  type: "body"   },
  { key: "s4",  type: "list",  items: 4 },
  { key: "s5",  type: "body"   },
  { key: "s6",  type: "list",  items: 3 },
  { key: "s7",  type: "body"   },
  { key: "s8",  type: "body"   },
  { key: "s9",  type: "list",  items: 2 },
  { key: "s10", type: "body"   },
  { key: "s11", type: "body"   },
  { key: "s12", type: "body"   },
  { key: "s13", type: "contact" },
];

export default function Privacy() {
  const t = useTranslations("Privacy");

  const bodyStyle: React.CSSProperties = {
    fontSize: "15px", color: "#7A5C44", margin: "0",
    lineHeight: "1.9", fontFamily: "'Jost', sans-serif", fontWeight: "300",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px", color: "#C8622A", fontFamily: "'Jost', sans-serif",
    fontWeight: "500", letterSpacing: "0.1em",
  };

  const h2Style: React.CSSProperties = {
    fontFamily: "'Fraunces', Georgia, serif", fontSize: "18px",
    fontWeight: "500", color: "#1A0E06", margin: "0 0 12px",
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FDFBF8" }}>

      <nav style={{ borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)" }} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <GlobeModal />
          <a href="/" style={{ fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif" }}>
            {t("nav.backHome")}
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "64px 32px 0" }}>
        <p style={{ fontSize: "11px", color: "#C8622A", margin: "0 0 12px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500" }}>
          {t("badge")}
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: "400", color: "#1A0E06", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          {t("title")}
        </h1>
        <p style={{ fontSize: "13px", color: "#7A5C44", margin: "0 0 56px", fontFamily: "'Jost', sans-serif" }}>
          {t("lastUpdated")}
        </p>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 32px 64px" }}>
        {sectionDefs.map((def, i) => {
          const isLast = i === sectionDefs.length - 1;

          let content: React.ReactNode;
          if (def.type === "body") {
            content = <p style={bodyStyle}>{t(`sections.${def.key}.body`)}</p>;
          } else if (def.type === "list") {
            const intro = t(`sections.${def.key}.intro`);
            content = (
              <>
                {intro && (
                  <p style={{ ...bodyStyle, marginBottom: "12px" }}>{intro}</p>
                )}
                <ul style={{ margin: 0, padding: "0 0 0 20px" }}>
                  {Array.from({ length: def.items }, (_, j) => (
                    <li key={j} style={{ ...bodyStyle, marginBottom: "6px" }}>
                      {t(`sections.${def.key}.item${j}`)}
                    </li>
                  ))}
                </ul>
              </>
            );
          } else {
            content = (
              <>
                <p style={{ ...bodyStyle, marginBottom: "16px" }}>{t("sections.s13.body")}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <p style={bodyStyle}>
                    <span style={labelStyle}>{t("sections.s13.emailLabel")}:</span>{" "}
                    <a href="mailto:hello@lomissa.com" style={{ color: "#C8622A", textDecoration: "none" }}>
                      hello@lomissa.com
                    </a>
                  </p>
                  <p style={bodyStyle}>
                    <span style={labelStyle}>{t("sections.s13.addressLabel")}:</span>{" "}
                    {t("sections.s13.address")}
                  </p>
                </div>
              </>
            );
          }

          return (
            <div
              key={def.key}
              style={{
                marginBottom: isLast ? "0" : "40px",
                paddingBottom: isLast ? "0" : "40px",
                borderBottom: isLast ? "none" : "1px solid #E2D5C8",
              }}
            >
              <h2 style={h2Style}>{t(`sections.${def.key}.title`)}</h2>
              {content}
            </div>
          );
        })}
      </div>

      <footer style={{ backgroundColor: "#FDFBF8", padding: "32px 48px", borderTop: "1px solid #E2D5C8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <Logo size="sm" asLink={false} />
        <div style={{ display: "flex", gap: "24px" }}>
          <a href="/privacy-policy" style={{ fontSize: "12px", color: "#C8622A", textDecoration: "none", fontFamily: "'Jost', sans-serif" }}>{t("footer.privacy")}</a>
          <a href="/terms-of-service" style={{ fontSize: "12px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif" }}>{t("footer.terms")}</a>
        </div>
        <p style={{ fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif" }}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}
