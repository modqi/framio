"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../../lib/supabase";
import Logo from "../../../components/Logo";
import { CameraIcon, CheckIcon, XIcon, ImageFileIcon } from "../../../components/Icons";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_FILES = 100;

interface FileEntry {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  url?: string;
  error?: string;
}

export default function DeliverPhotos({ params }: { params: any }) {
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [message, setMessage] = useState("");
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const resolve = async () => {
      const id = typeof params?.then === "function"
        ? (await params).bookingId
        : params.bookingId;
      setBookingId(id);
    };
    resolve();
  }, [params]);

  useEffect(() => {
    if (!bookingId) return;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      if (user.user_metadata?.role !== "photographer") {
        window.location.href = "/dashboard";
        return;
      }
      setUser(user);

      const { data: bk } = await supabase
        .from("bookings")
        .select("id, client_name, session_type, date, status, photographer_id")
        .eq("id", bookingId)
        .single();

      if (!bk || bk.photographer_id !== user.id) {
        window.location.href = "/photographer-dashboard";
        return;
      }
      if (!["completed", "photos_delivered"].includes(bk.status)) {
        window.location.href = "/photographer-dashboard";
        return;
      }
      setBooking(bk);
      setLoading(false);
    };
    init();
  }, [bookingId]);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    const oversized = picked.filter(f => f.size > MAX_FILE_SIZE);
    if (oversized.length) {
      setError(`${oversized.length} file(s) exceed 20 MB and were skipped.`);
    } else {
      setError(null);
    }
    const valid = picked.filter(f => f.size <= MAX_FILE_SIZE);
    setFiles(prev => {
      const combined = [...prev, ...valid.map(f => ({ file: f, status: "pending" as const }))];
      if (combined.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} photos per delivery. Only the first ${MAX_FILES} were kept.`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeliver = async () => {
    if (files.length === 0) { setError("Please select at least one photo."); return; }
    setError(null);
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? "";

    // Upload each file sequentially, showing progress
    const uploaded: { url: string; filename: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      setUploadingIndex(i);
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "uploading" } : f));

      try {
        const formData = new FormData();
        formData.append("file", files[i].file);
        formData.append("type", "delivery");
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (!data.url) throw new Error(data.error || "Upload failed");

        uploaded.push({ url: data.url, filename: files[i].file.name });
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "done", url: data.url } : f));
      } catch (err: any) {
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "error", error: err.message } : f));
      }
    }

    setUploadingIndex(null);

    if (uploaded.length === 0) {
      setError("All uploads failed. Please try again.");
      setSubmitting(false);
      return;
    }

    if (uploaded.length < files.length) {
      setError(`${files.length - uploaded.length} photo(s) failed to upload and were excluded.`);
    }

    // Create delivery record
    const res = await fetch("/api/deliver-photos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingId, message, photos: uploaded }),
    });

    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save delivery. Please try again.");
    }
    setSubmitting(false);
  };

  const uploadedCount = files.filter(f => f.status === "done").length;
  const progress = files.length > 0 && submitting
    ? `Uploading ${Math.min(uploadingIndex !== null ? uploadingIndex + 1 : uploadedCount, files.length)} of ${files.length}…`
    : null;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "#FDFBF8"}}>
      <p style={{fontSize: "13px", color: "#C8622A", fontFamily: "'Jost', sans-serif"}}>Loading…</p>
    </div>
  );

  if (done) return (
    <main className="min-h-screen flex flex-col items-center justify-center" style={{backgroundColor: "#FDFBF8", padding: "40px 24px"}}>
      <div style={{maxWidth: "480px", width: "100%", textAlign: "center"}}>
        <div style={{marginBottom: "24px"}}><CameraIcon size={56} color="#C8622A"/></div>
        <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: "400", color: "#1A0E06", margin: "0 0 12px"}}>Photos delivered!</h1>
        <p style={{fontSize: "14px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", lineHeight: "1.7", margin: "0 0 32px"}}>
          {uploadedCount} photo{uploadedCount === 1 ? "" : "s"} sent to {booking?.client_name}. They'll receive an email with a link to view and download them.
          The 7-day dispute window has started.
        </p>
        <a href="/photographer-dashboard" style={{backgroundColor: "#1A0E06", color: "#FDFBF8", fontSize: "13px", padding: "12px 32px", borderRadius: "999px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: "500", display: "inline-block"}}>
          Back to dashboard
        </a>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FDFBF8"}}>
      <nav style={{borderBottom: "1px solid #E2D5C8", backgroundColor: "rgba(253,251,248,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <a href="/photographer-dashboard" style={{fontSize: "13px", color: "#7A5C44", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>← Back to dashboard</a>
      </nav>

      <div style={{maxWidth: "720px", margin: "0 auto", padding: "48px 24px"}}>
        {/* Header */}
        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>DELIVER PHOTOS</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "36px", fontWeight: "400", color: "#1A0E06", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
            {booking?.client_name}
          </h1>
          <p style={{fontSize: "14px", color: "#7A5C44", fontFamily: "'Jost', sans-serif", margin: "0"}}>
            {booking?.session_type} · {booking?.date}
          </p>
          {booking?.status === "photos_delivered" && (
            <p style={{fontSize: "13px", color: "#7c3aed", fontFamily: "'Jost', sans-serif", margin: "8px 0 0"}}>
              You've already made a delivery for this booking. This will add a supplementary batch.
            </p>
          )}
        </div>

        {/* Message */}
        <div style={{marginBottom: "32px"}}>
          <label style={{display: "block", fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
            MESSAGE TO CLIENT <span style={{color: "#DDD0C0"}}>(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Add a personal note — thank them for the session, describe your editing approach, or share anything else…"
            rows={4}
            disabled={submitting}
            style={{width: "100%", border: "1px solid #E2D5C8", borderRadius: "12px", padding: "16px", fontSize: "14px", fontFamily: "'Jost', sans-serif", resize: "vertical", outline: "none", backgroundColor: "#FDFBF8", color: "#1A0E06", boxSizing: "border-box"}}
          />
        </div>

        {/* File picker */}
        <div style={{marginBottom: "24px"}}>
          <label style={{display: "block", fontSize: "11px", color: "#C8622A", margin: "0 0 8px", letterSpacing: "0.15em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>
            PHOTOS ({files.length}/{MAX_FILES})
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style={{display: "none"}}
            onChange={handleFilePick}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting || files.length >= MAX_FILES}
            style={{
              width: "100%", padding: "32px", border: "2px dashed #E2D5C8",
              borderRadius: "12px", backgroundColor: "#FDFBF8", cursor: "pointer",
              fontFamily: "'Jost', sans-serif", fontSize: "14px", color: "#7A5C44",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
              opacity: files.length >= MAX_FILES ? 0.5 : 1,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DDD0C0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>Click to select photos</span>
            <span style={{fontSize: "12px", color: "#DDD0C0"}}>JPG, PNG, WEBP · Max 20 MB each · Up to {MAX_FILES} photos</span>
          </button>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div style={{marginBottom: "32px", display: "flex", flexDirection: "column", gap: "8px"}}>
            {files.map((entry, i) => (
              <div key={i} style={{display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "8px", border: "1px solid #E2D5C8", backgroundColor: entry.status === "done" ? "#f0fdf4" : entry.status === "error" ? "#fef2f2" : "#FDFBF8"}}>
                <div style={{fontSize: "18px", flexShrink: 0}}>
                  {entry.status === "done" ? <CheckIcon size={18} color="#16a34a"/> : entry.status === "error" ? <XIcon size={18} color="#dc2626"/> : entry.status === "uploading" ? <ImageFileIcon size={18} color="#C8622A"/> : <ImageFileIcon size={18} color="#DDD0C0"/>}
                </div>
                <div style={{flex: 1, minWidth: 0}}>
                  <p style={{fontSize: "13px", color: "#1A0E06", margin: "0", fontFamily: "'Jost', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{entry.file.name}</p>
                  <p style={{fontSize: "11px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>
                    {entry.status === "uploading" ? "Uploading…" : entry.status === "error" ? (entry.error || "Failed") : (entry.file.size / (1024 * 1024)).toFixed(1) + " MB"}
                  </p>
                </div>
                {!submitting && entry.status === "pending" && (
                  <button onClick={() => removeFile(i)} style={{background: "none", border: "none", cursor: "pointer", color: "#DDD0C0", fontSize: "16px", padding: "0", flexShrink: 0}}>✕</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{marginBottom: "20px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "#fef2f2", border: "1px solid #fecaca"}}>
            <p style={{fontSize: "13px", color: "#dc2626", margin: "0", fontFamily: "'Jost', sans-serif"}}>{error}</p>
          </div>
        )}

        {/* Submit */}
        <div style={{display: "flex", gap: "12px", alignItems: "center"}}>
          <button
            onClick={handleDeliver}
            disabled={submitting || files.length === 0}
            style={{backgroundColor: files.length === 0 || submitting ? "#7A5C44" : "#C8622A", color: "#FDFBF8", fontSize: "14px", padding: "14px 40px", border: "none", borderRadius: "999px", cursor: files.length === 0 || submitting ? "default" : "pointer", fontWeight: "500", fontFamily: "'Jost', sans-serif", opacity: files.length === 0 ? 0.5 : 1}}
          >
            {progress || `Deliver ${files.length > 0 ? files.length + " photo" + (files.length === 1 ? "" : "s") : "photos"}`}
          </button>
          {submitting && (
            <p style={{fontSize: "12px", color: "#7A5C44", margin: "0", fontFamily: "'Jost', sans-serif"}}>
              Please keep this page open…
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
