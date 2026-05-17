"use client";
import { useState, useEffect } from "react";
import JSZip from "jszip";
import { useTranslations } from "../../../lib/i18n";
import { supabase } from "../../../lib/supabase";
import Logo from "../../components/Logo";
import { EmptyInboxIcon } from "../../components/Icons";

// Force Cloudinary to serve the file as a download attachment (handles both upload and authenticated URL formats)
const downloadUrl = (url: string) => url.replace(/\/(upload|authenticated)\//, "/$1/fl_attachment/");

export default function PhotoGallery({ params }: { params: any }) {
  const t = useTranslations("Deliveries");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ view: string; dl: string } | null>(null);
  const [zipping, setZipping] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});
  const [urlsExpiresAt, setUrlsExpiresAt] = useState(0);

  useEffect(() => {
    const resolve = async () => {
      const id = typeof params?.then === "function"
        ? (await params).bookingId
        : params.bookingId;
      setBookingId(id);
    };
    resolve();
  }, [params]);

  const fetchSignedUrls = async (deliveryIds: string[], token: string) => {
    const newSigned: Record<string, string> = {};
    const newDownload: Record<string, string> = {};
    let latestExpiry = 0;
    for (const deliveryId of deliveryIds) {
      try {
        const res = await fetch(`/api/deliveries/${deliveryId}/signed-urls`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) continue;
        const data = await res.json();
        Object.assign(newSigned, data.signedUrls || {});
        Object.assign(newDownload, data.downloadUrls || {});
        if (data.expiresAt) latestExpiry = new Date(data.expiresAt).getTime();
      } catch {
        // silent — page falls back to stored URLs
      }
    }
    setSignedUrls(prev => ({ ...prev, ...newSigned }));
    setDownloadUrls(prev => ({ ...prev, ...newDownload }));
    if (latestExpiry) setUrlsExpiresAt(latestExpiry);
  };

  useEffect(() => {
    if (!bookingId) return;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      setUser(user);

      const { data: bk } = await supabase
        .from("bookings")
        .select("id, photographer_name, session_type, date, client_id, photographer_id")
        .eq("id", bookingId)
        .single();

      if (!bk || (bk.client_id !== user.id && bk.photographer_id !== user.id)) {
        window.location.href = "/dashboard";
        return;
      }
      setBooking(bk);

      // Fetch deliveries and their photos via API (service client bypasses RLS, manual auth check inside)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const dlRes = await fetch(`/api/photo-deliveries?bookingId=${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (dlRes.ok) {
        const { deliveries: rows } = await dlRes.json();
        if (rows?.length) {
          setDeliveries(rows);
          const deliveryIds = rows.map((d: any) => d.id);
          await fetchSignedUrls(deliveryIds, token);
        }
      }

      setLoading(false);
    };
    init();
  }, [bookingId]);

  const handleDownloadAll = async (delivery: { id: string; photos: any[] }) => {
    setZipping(delivery.id);
    try {
      const zip = new JSZip();
      await Promise.all(
        delivery.photos.map(async (photo: any, i: number) => {
          const url = downloadUrls[photo.id];
          if (!url) return;
          try {
            const res = await fetch(url);
            if (!res.ok) return;
            const buf = await res.arrayBuffer();
            const name = photo.filename || `photo-${i + 1}.jpg`;
            zip.file(name, buf);
          } catch {
            // skip failed photos — user can still download individually
          }
        })
      );
      const blob = await zip.generateAsync({ type: "blob" });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${booking?.session_type || "photos"}.zip`;
      a.click();
      URL.revokeObjectURL(href);
    } catch {
      // silent — user can still download individually
    }
    setZipping(null);
  };

  // Refresh signed URLs 10 minutes before they expire (self-perpetuating 50-minute cycle)
  useEffect(() => {
    if (!urlsExpiresAt || !deliveries.length) return;
    const msUntilRefresh = urlsExpiresAt - Date.now() - 10 * 60 * 1000;
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) fetchSignedUrls(deliveries.map((d: any) => d.id), session.access_token);
    }, Math.max(msUntilRefresh, 5000));
    return () => clearTimeout(timer);
  }, [urlsExpiresAt]);

  // Also refresh when the tab regains focus if URLs are nearly expired
  useEffect(() => {
    if (!urlsExpiresAt || !deliveries.length) return;
    const handleVisibility = async () => {
      if (document.visibilityState !== "visible") return;
      if (urlsExpiresAt - Date.now() < 10 * 60 * 1000) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) fetchSignedUrls(deliveries.map((d: any) => d.id), session.access_token);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [urlsExpiresAt, deliveries]);

  const totalPhotos = deliveries.reduce((s, d) => s + d.photos.length, 0);
  const isPhotographer = user?.id === booking?.photographer_id;
  const backHref = isPhotographer ? "/photographer-dashboard" : "/dashboard";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FDFBF8"}}>
      <p style={{fontSize: "13px", color: "#C8622A", fontFamily: "'Jost', sans-serif"}}>{t("loading")}</p>
    </div>
  );

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>
      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4 sticky top-0 z-10">
        <Logo size="sm" />
        <a href={backHref} style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>
          {t("nav.backToDashboard")}
        </a>
      </nav>

      {/* Header */}
      <div style={{backgroundColor: "#FDFBF8", borderBottom: "1px solid #E2D5C8", padding: "40px 32px"}}>
        <div style={{maxWidth: "1100px", margin: "0 auto"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{t("header.badge")}</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "42px", fontWeight: "400", color: "#1A0E06", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
            {booking?.session_type}
          </h1>
          <p style={{fontSize: "14px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", margin: "0"}}>
            {booking?.photographer_name} · {booking?.date} · {totalPhotos === 1 ? t("header.photoCountSingular" as any) : t("header.photoCountPlural", { count: totalPhotos } as any)}
          </p>
        </div>
      </div>

      {/* Deliveries */}
      <div style={{maxWidth: "1100px", margin: "0 auto", padding: "40px 32px"}}>
        {deliveries.length === 0 ? (
          <div style={{textAlign: "center", padding: "80px 0"}}>
            <div style={{marginBottom: "16px"}}><EmptyInboxIcon size={56} color="#C8622A"/></div>
            <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "24px", color: "#1A0E06", margin: "0 0 8px"}}>{t("empty.title")}</p>
            <p style={{fontSize: "14px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", margin: "0"}}>{t("empty.description")}</p>
          </div>
        ) : deliveries.map((delivery, di) => (
          <div key={delivery.id} style={{marginBottom: "64px"}}>
            {/* Delivery header */}
            <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "24px"}}>
              <div>
                {deliveries.length > 1 && (
                  <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 4px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
                    {t("delivery.label", { number: di + 1 } as any)}
                  </p>
                )}
                <p style={{fontSize: "13px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>
                  {new Date(delivery.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · {delivery.photos.length === 1 ? t("delivery.photoCountSingular" as any) : t("delivery.photoCountPlural", { count: delivery.photos.length } as any)}
                </p>
                {delivery.message && (
                  <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px", color: "#7A5C44", fontStyle: "italic", margin: "8px 0 0", maxWidth: "600px", lineHeight: "1.7"}}>
                    "{delivery.message}"
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDownloadAll(delivery)}
                disabled={zipping === delivery.id}
                style={{backgroundColor: "#1A0E06", color: "#FDFBF8", fontSize: "13px", padding: "10px 24px", border: "none", borderRadius: "999px", cursor: zipping === delivery.id ? "default" : "pointer", fontWeight: "500", fontFamily: "'Jost', sans-serif", flexShrink: 0, opacity: zipping === delivery.id ? 0.6 : 1}}
              >
                {zipping === delivery.id ? t("delivery.preparing") : t("delivery.downloadAll", { count: delivery.photos.length } as any)}
              </button>
            </div>

            {/* Photo grid */}
            <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "8px"}}>
              {delivery.photos.map((photo: any) => {
                const viewUrl = signedUrls[photo.id] || photo.cloudinary_url || "";
                const dlUrl = downloadUrls[photo.id] || (photo.cloudinary_url ? downloadUrl(photo.cloudinary_url) : "");
                return (
                  <div
                    key={photo.id}
                    style={{position: "relative", aspectRatio: "1", borderRadius: "8px", overflow: "hidden", backgroundColor: "#E2D5C8", cursor: "zoom-in"}}
                    onClick={() => setLightbox({ view: viewUrl, dl: dlUrl })}
                  >
                    <img
                      src={viewUrl}
                      alt={photo.filename || "Delivered photo"}
                      style={{width: "100%", height: "100%", objectFit: "cover", display: "block"}}
                      loading="lazy"
                    />
                    {/* Download hover overlay */}
                    <a
                      href={dlUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        position: "absolute", bottom: "8px", right: "8px",
                        backgroundColor: "rgba(0,0,0,0.55)", color: "#fff",
                        borderRadius: "6px", padding: "5px 10px",
                        fontSize: "11px", fontFamily: "'Jost', sans-serif",
                        textDecoration: "none", backdropFilter: "blur(4px)",
                        opacity: 0,
                        transition: "opacity 0.15s",
                      }}
                      className="photo-dl-btn"
                      title="Download"
                    >
                      {t("delivery.save")}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out", padding: "24px"}}
        >
          <img
            src={lightbox.view}
            alt="Full size"
            style={{maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "4px"}}
            onClick={e => e.stopPropagation()}
          />
          <div style={{position: "absolute", top: "20px", right: "20px", display: "flex", gap: "10px"}}>
            <a
              href={lightbox.dl}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
              style={{background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", backdropFilter: "blur(4px)"}}
              title="Download"
            >

            </a>
            <button
              onClick={() => setLightbox(null)}
              style={{background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center"}}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hover effect for download buttons */}
      <style>{`
        div:hover > .photo-dl-btn { opacity: 1 !important; }
      `}</style>
    </main>
  );
}
