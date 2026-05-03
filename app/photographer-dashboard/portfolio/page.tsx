"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import Logo from "../../components/Logo";

export default function Portfolio() {
  const [user, setUser] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
      } else if (user.user_metadata?.role !== "photographer") {
        window.location.href = "/dashboard";
      } else {
        setUser(user);
        const { data } = await supabase
          .from("portfolio_photos")
          .select("*")
          .eq("photographer_id", user.id)
          .order("order_index", { ascending: true });
        setPhotos(data || []);
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    let nextIndex = photos.length;
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Each photo must be under 10MB");
        continue;
      }
      try {
        const formData = new FormData();
        formData.append("file", file);
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Authorization": `Bearer ${session?.access_token ?? ""}` },
          body: formData,
        });
        const data = await response.json();
        if (data.url) {
          const { data: photo } = await supabase
            .from("portfolio_photos")
            .insert({
              photographer_id: user.id,
              url: data.url,
              order_index: nextIndex,
            })
            .select()
            .single();
          if (photo) {
            nextIndex++;
            setPhotos(prev => [...prev, photo]);
          }
        }
      } catch (err) {
        setError("Upload failed. Please try again.");
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);
    await supabase.from("portfolio_photos").delete().eq("id", id);
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p style={{fontSize: "13px", color: "#C4907A"}}>Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{backgroundColor: "#FAF7F1"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #E4D8C4", backgroundColor: "rgba(250,247,241,0.96)", backdropFilter: "blur(12px)"}} className="flex items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <a href="/photographer-dashboard" style={{fontSize: "13px", color: "#7A5235", textDecoration: "none", fontFamily: "'Jost', sans-serif"}}>← Dashboard</a>
      </nav>

      <div style={{maxWidth: "900px", margin: "0 auto", padding: "48px 32px"}}>

        {/* Header */}
        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 12px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>MY WORK</p>
          <h1 style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: "400", color: "#1C1009", margin: "0 0 8px", letterSpacing: "-0.02em"}}>
            My portfolio
          </h1>
          <p style={{fontSize: "14px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>
            Upload your best photos — these appear on your public profile
          </p>
        </div>

        {/* Upload area */}
        <div style={{marginBottom: "40px"}}>
          <label style={{display: "block", cursor: "pointer"}}>
            <div style={{border: "2px dashed #E4D8C4", borderRadius: "12px", padding: "48px 32px", textAlign: "center", backgroundColor: uploading ? "#F5EFE4" : "#FDFBF7", transition: "all 0.2s"}}>
              {uploading ? (
                <div>
                  <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "400", color: "#B85528", margin: "0 0 8px"}}>Uploading...</p>
                  <p style={{fontSize: "13px", color: "#9E7250", margin: "0", fontFamily: "'Jost', sans-serif"}}>Please wait while we upload your photos</p>
                </div>
              ) : (
                <div>
                  <p style={{fontSize: "40px", margin: "0 0 16px"}}>📸</p>
                  <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "400", color: "#1C1009", margin: "0 0 8px"}}>Upload your photos</p>
                  <p style={{fontSize: "13px", color: "#9E7250", margin: "0 0 16px", fontFamily: "'Jost', sans-serif"}}>Click to browse or drag and drop your photos here</p>
                  <span style={{fontSize: "12px", color: "#B85528", border: "1px solid #B85528", padding: "8px 24px", borderRadius: "999px", fontFamily: "'Jost', sans-serif"}}>
                    Choose photos
                  </span>
                  <p style={{fontSize: "11px", color: "#C3AB88", margin: "16px 0 0", fontFamily: "'Jost', sans-serif"}}>JPG, PNG up to 10MB each — multiple photos allowed</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              style={{display: "none"}}
            />
          </label>

          {error && (
            <div style={{marginTop: "12px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "#fff8f8", border: "1px solid #fce8e8"}}>
              <p style={{fontSize: "13px", color: "#cc0000", margin: "0"}}>{error}</p>
            </div>
          )}
        </div>

        {/* Photos grid */}
        {photos.length === 0 ? (
          <div style={{textAlign: "center", padding: "48px 0"}}>
            <p style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "22px", fontWeight: "400", color: "#C3AB88", margin: "0 0 8px"}}>No photos yet</p>
            <p style={{fontSize: "13px", color: "#C3AB88", margin: "0", fontFamily: "'Jost', sans-serif"}}>Upload your first photo to get started</p>
          </div>
        ) : (
          <div>
            <p style={{fontSize: "11px", color: "#B85528", margin: "0 0 20px", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif", fontWeight: "500"}}>{photos.length} PHOTOS</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div key={photo.id} style={{position: "relative", aspectRatio: "3/4", borderRadius: "8px", overflow: "hidden", backgroundColor: "#f5f5f5"}}>
                  <img
                    src={photo.url}
                    alt={`Portfolio photo ${index + 1}`}
                    style={{width: "100%", height: "100%", objectFit: "cover"}}
                  />
                  <div style={{position: "absolute", top: "8px", right: "8px", display: "flex", gap: "4px", alignItems: "center"}}>
                    {confirmDeleteId === photo.id && (
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        style={{backgroundColor: "#fff", border: "none", borderRadius: "12px", padding: "4px 8px", cursor: "pointer", fontSize: "11px", color: "#7A5235", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontFamily: "'Jost', sans-serif"}}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(photo.id)}
                      style={{backgroundColor: confirmDeleteId === photo.id ? "#dc2626" : "#fff", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: confirmDeleteId === photo.id ? "10px" : "14px", color: confirmDeleteId === photo.id ? "#fff" : "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontWeight: "600"}}
                    >
                      {confirmDeleteId === photo.id ? "Yes" : "✕"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#FAF7F1", padding: "32px 48px", borderTop: "1px solid #E4D8C4", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <Logo size="sm" asLink={false} />
        <p style={{fontSize: "12px", color: "#C3AB88", margin: "0", fontFamily: "'Jost', sans-serif"}}>© 2026 Lomissa. All rights reserved.</p>
      </footer>

    </main>
  );
}