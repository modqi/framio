"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function PhotographerProfile() {
  const [photographer, setPhotographer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionType, setSessionType] = useState("Portrait (2 hours)");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = window.location.pathname.split("/").pop();
    const getPhotographer = async () => {
      const { data } = await supabase
        .from("photographers")
        .select("*")
        .eq("id", id)
        .single();
      setPhotographer(data);
      setLoading(false);
    };
    getPhotographer();
  }, []);

  const handleBooking = async () => {
    setBooking(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    const { error } = await supabase.from("bookings").insert({
      client_id: user.id,
      client_name: user.user_metadata?.name || "",
      client_email: user.email,
      photographer_name: photographer?.name,
      photographer_id: photographer?.user_id,
      session_type: sessionType,
      date: date,
      location: location,
      message: message,
      price: photographer?.price || "Price on request",
      status: "pending",
    });
    if (error) {
      setError("Something went wrong. Please try again.");
    } else {
      setBooked(true);
    }
    setBooking(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!photographer) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Photographer not found</p>
          <a href="/photographers" className="bg-black text-white px-6 py-3 rounded-full text-sm">Browse photographers</a>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <a href="/" className="text-2xl font-bold text-black" style={{fontFamily: "Georgia, serif"}}>Framio</a>
        <div className="flex items-center gap-4">
          <a href="/photographers" style={{color: "#888780", fontSize: "14px"}}>Explore</a>
          <a href="/signup" className="bg-black text-white text-sm px-4 py-2 rounded-full hover:bg-gray-800">Sign up</a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="w-40 h-40 rounded-2xl bg-gray-100 flex items-center justify-center text-4xl font-bold text-gray-400 flex-shrink-0">
            {photographer.name?.[0] || "?"}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-black mb-1">{photographer.name}</h1>
                <p className="text-gray-500 mb-1">{photographer.location}</p>
                <p className="text-gray-500 mb-3">{photographer.specialty}</p>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-medium">{photographer.rating || "New"}</span>
                  <span className="ml-2 bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full">Available</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-black">{photographer.price || "On request"}</p>
                <p className="text-gray-400 text-sm">per session</p>
              </div>
            </div>
            <p className="text-gray-600 mt-4 leading-relaxed">{photographer.bio || "No bio yet."}</p>
            <div className="flex gap-4 mt-4">
              {photographer.instagram && (
                <a href={`https://instagram.com/${photographer.instagram}`} target="_blank" className="text-sm text-gray-500 hover:text-black">
                  @{photographer.instagram}
                </a>
              )}
              {photographer.website && (
                <a href={photographer.website} target="_blank" className="text-sm text-gray-500 hover:text-black">
                  Website
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Left — Portfolio */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold mb-4">Portfolio</h2>
            <div className="grid grid-cols-3 gap-3 mb-10">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 text-sm">
                  Photo {i}
                </div>
              ))}
            </div>
            <h2 className="text-xl font-bold mb-4">Reviews</h2>
            <div className="border border-gray-100 rounded-xl p-8 text-center">
              <p className="text-gray-400 text-sm">No reviews yet</p>
            </div>
          </div>

          {/* Right — Booking Card */}
          <div className="md:col-span-1">
            <div className="border border-gray-200 rounded-2xl p-6 sticky top-8">
              {booked ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-lg font-bold text-black mb-2">Booking requested!</h3>
                  <p className="text-gray-500 text-sm mb-4">{photographer.name} will respond within 24 hours.</p>
                  <a href="/dashboard" className="bg-black text-white text-sm px-6 py-3 rounded-full hover:bg-gray-800 inline-block">
                    View my bookings
                  </a>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold mb-1">Book {photographer.name?.split(" ")[0]}</h3>
                  <p className="text-gray-400 text-sm mb-6">Choose your session details</p>

                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 block mb-2">Session type</label>
                    <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none">
                      <option>Portrait (2 hours)</option>
                      <option>Wedding (Full day)</option>
                      <option>Engagement (3 hours)</option>
                      <option>Family (2 hours)</option>
                      <option>Event (4 hours)</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 block mb-2">Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"/>
                  </div>

                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 block mb-2">Location</label>
                    <input type="text" placeholder="Where is the shoot?" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"/>
                  </div>

                  <div className="mb-6">
                    <label className="text-sm font-medium text-gray-700 block mb-2">Message</label>
                    <textarea placeholder="Tell them about your vision..." value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none resize-none"/>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
                  )}

                  <button onClick={handleBooking} disabled={booking} className="w-full bg-black text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors">
                    {booking ? "Sending request..." : "Request to Book"}
                  </button>
                  <p className="text-center text-gray-400 text-xs mt-3">You won't be charged yet</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}