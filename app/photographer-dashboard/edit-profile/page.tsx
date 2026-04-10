"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function EditProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    specialty: "",
    location: "",
    price: "",
    instagram: "",
    website: "",
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
      } else {
        setUser(user);
        setForm(prev => ({
          ...prev,
          name: user.user_metadata?.name || "",
        }));
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        bio: form.bio,
        specialty: form.specialty,
        location: form.location,
        price: form.price,
        instagram: form.instagram,
        website: form.website,
        name: form.name,
      }
    });
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Navigation */}
      <nav style={{borderBottom: "0.5px solid #e5e5e5", backgroundColor: "white"}} className="flex items-center justify-between px-8 py-5">
        <a href="/" className="text-2xl font-bold text-black" style={{fontFamily: "Georgia, serif"}}>
          Framio
        </a>
        <div className="flex items-center gap-4">
          <a href="/photographer-dashboard" className="text-gray-500 text-sm hover:text-black">
            Back to dashboard
          </a>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-12">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Edit your profile</h1>
          <p className="text-gray-500">A complete profile gets 3x more bookings</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col gap-6">

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              placeholder="Your full name"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({...form, location: e.target.value})}
              placeholder="e.g. Bergen, Norway"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          {/* Specialty */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Specialty</label>
            <select
              value={form.specialty}
              onChange={(e) => setForm({...form, specialty: e.target.value})}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black"
            >
              <option value="">Select your specialty</option>
              <option>Weddings</option>
              <option>Portraits</option>
              <option>Events</option>
              <option>Travel</option>
              <option>Fashion</option>
              <option>Commercial</option>
              <option>Street</option>
              <option>Nature</option>
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Starting price</label>
            <input
              type="text"
              value={form.price}
              onChange={(e) => setForm({...form, price: e.target.value})}
              placeholder="e.g. 2500 NOK per session"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({...form, bio: e.target.value})}
              placeholder="Tell clients about yourself, your style and your experience..."
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black resize-none"
            />
            <p className="text-gray-400 text-xs mt-1">{form.bio.length}/500 characters</p>
          </div>

          {/* Instagram */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Instagram handle</label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-black">
              <span className="px-4 py-3 bg-gray-50 text-gray-400 text-sm border-r border-gray-200">@</span>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => setForm({...form, instagram: e.target.value})}
                placeholder="yourhandle"
                className="flex-1 px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Website</label>
            <input
              type="text"
              value={form.website}
              onChange={(e) => setForm({...form, website: e.target.value})}
              placeholder="https://yourwebsite.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          {/* Save button */}
          {saved && (
            <div className="p-3 rounded-xl bg-green-50 text-green-700 text-sm text-center">
              Profile saved successfully!
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-black text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>

        </div>
      </div>
    </main>
  );
}