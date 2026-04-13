"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function Portfolio() {
  const [user, setUser] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
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
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Each photo must be under 10MB");
        continue;
      }
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (data.url) {
          const { data: photo } = await supabase
            .from("portfolio_photos")
            .insert({
              photographer_id: user.id,
              url: data.url,
              order_index: photos.length,
            })
            .select()
            .single();
          if (photo) {
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
    <main className="min-h-screen" style={{backgroundColor: "#FAFAF8"}}>

      {/* Navigation */}
      <nav style={{borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff"}} className="flex items-center justify-between px-8 py-5">
        <div className="flex items-baseline gap-3">
          <a href="/" style={{fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-1px", textDecoration: "none"}}>Framio</a>
          <span style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", paddingLeft: "8px", borderLeft: "1px solid #f0f0f0"}}>PHOTOGRAPHY</span>
        </div>
        <a href="/photographer-dashboard" style={{fontSize: "12px", color: "#888", textDecoration: "none", border: "1px solid #e5e5e5", padding: "6px 16px", borderRadius: "20px"}}>
          Back to dashboard
        </a>
      </nav>

      <div style={{maxWidth: "900px", margin: "0 auto", padding: "48px 32px"}}>

        {/* Header */}
        <div style={{marginBottom: "40px"}}>
          <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 8px", letterSpacing: "1px"}}>My work</p>
          <h1 style={{fontFamily: "Georgia, serif", fontSize: "36px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-1px"}}>
            My portfolio
          </h1>
          <p style={{fontSize: "14px", color: "#888", margin: "0"}}>
            Upload your best photos — these appear on your public profile
          </p>
        </div>

        {/* Upload area */}
        <div style={{marginBottom: "40px"}}>
          <label style={{display: "block", cursor: "pointer"}}>
            <div style={{border: "2px dashed #f0e8e0", borderRadius: "12px", padding: "48px 32px", textAlign: "center", backgroundColor: uploading ? "#FDF8F5" : "#fff", transition: "all 0.2s"}}>
              {uploading ? (
                <div>
                  <p style={{fontFamily: "Georgia, serif", fontSize: "20px", color: "#C4907A", margin: "0 0 8px"}}>Uploading...</p>
                  <p style={{fontSize: "13px", color: "#888", margin: "0"}}>Please wait while we upload your photos</p>
                </div>
              ) : (
                <div>
                  <p style={{fontSize: "40px", margin: "0 0 16px"}}>📸</p>
                  <p style={{fontFamily: "Georgia, serif", fontSize: "20px", color: "#1a1a1a", margin: "0 0 8px"}}>Upload your photos</p>
                  <p style={{fontSize: "13px", color: "#888", margin: "0 0 16px"}}>Click to browse or drag and drop your photos here</p>
                  <span style={{fontSize: "12px", color: "#C4907A", border: "1px solid #C4907A", padding: "8px 24px", borderRadius: "20px"}}>
                    Choose photos
                  </span>
                  <p style={{fontSize: "11px", color: "#aaa", margin: "16px 0 0"}}>JPG, PNG up to 10MB each — multiple photos allowed</p>
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
            <p style={{fontFamily: "Georgia, serif", fontSize: "20px", color: "#aaa", margin: "0 0 8px"}}>No photos yet</p>
            <p style={{fontSize: "13px", color: "#aaa", margin: "0"}}>Upload your first photo to get started</p>
          </div>
        ) : (
          <div>
            <p style={{fontSize: "12px", color: "#C4907A", margin: "0 0 20px", letterSpacing: "1px"}}>{photos.length} PHOTOS</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div key={photo.id} style={{position: "relative", aspectRatio: "3/4", borderRadius: "8px", overflow: "hidden", backgroundColor: "#f5f5f5"}}>
                  <img
                    src={photo.url}
                    alt={`Portfolio photo ${index + 1}`}
                    style={{width: "100%", height: "100%", objectFit: "cover"}}
                  />
                  <button
                    onClick={() => handleDelete(photo.id)}
                    style={{position: "absolute", top: "8px", right: "8px", backgroundColor: "#fff", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)"}}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{backgroundColor: "#fff", padding: "32px 48px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "48px"}}>
        <div>
          <p style={{fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 4px"}}>Framio</p>
          <p style={{fontSize: "8px", letterSpacing: "3px", color: "#C4907A", margin: "0"}}>PHOTOGRAPHY MARKETPLACE</p>
        </div>
        <p style={{fontSize: "12px", color: "#888", margin: "0"}}>© 2026 Framio. All rights reserved.</p>
      </footer>

    </main>
  );
}