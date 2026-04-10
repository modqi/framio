"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
      } else {
        setUser(user);
        const { data } = await supabase
          .from("bookings")
          .select("*")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false });
        setBookings(data || []);
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const getStatusColor = (status: string) => {
    if (status === "confirmed") return { bg: "#f0fdf4", text: "#15803d" };
    if (status === "declined") return { bg: "#fef2f2", text: "#dc2626" };
    return { bg: "#fefce8", text: "#ca8a04" };
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
          <span className="text-gray-600 text-sm">
            Hello, {user?.user_metadata?.name || user?.email} 👋
          </span>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-black border border-gray-200 px-4 py-2 rounded-full"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">

        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-black mb-2">
            Welcome back, {user?.user_metadata?.name?.split(" ")[0] || "there"}! 👋
          </h1>
          <p className="text-gray-500">Find and book talented photographers around the world.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Bookings", value: bookings.length.toString(), desc: "Total bookings made" },
            { label: "Upcoming", value: bookings.filter(b => b.status === "confirmed").length.toString(), desc: "Confirmed sessions" },
            { label: "Photographers", value: "6", desc: "Available near you" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-6 border border-gray-100">
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-4xl font-bold text-black mb-1">{stat.value}</p>
              <p className="text-gray-400 text-xs">{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-10">
          <h2 className="text-lg font-bold text-black mb-4">Quick actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/photographers" className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-black transition-colors">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white text-lg">📸</div>
              <div>
                <p className="font-medium text-black">Find a photographer</p>
                <p className="text-gray-400 text-sm">Browse all photographers</p>
              </div>
            </a>
            <a href="#" className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-black transition-colors">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white text-lg">⭐</div>
              <div>
                <p className="font-medium text-black">My reviews</p>
                <p className="text-gray-400 text-sm">Reviews you have left</p>
              </div>
            </a>
          </div>
        </div>

        {/* Bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-black mb-6">My bookings</h2>

          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-5xl mb-4">📷</div>
              <p className="text-gray-400 text-sm">No bookings yet</p>
              <p className="text-gray-300 text-xs mt-1">Your bookings will appear here</p>
              <a href="/photographers" className="mt-6 bg-black text-white text-sm px-6 py-3 rounded-full hover:bg-gray-800">
                Find a photographer
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.map((booking) => {
                const colors = getStatusColor(booking.status);
                return (
                  <div key={booking.id} className="border border-gray-100 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-black text-lg">{booking.photographer_name}</p>
                        <p className="text-gray-500 text-sm">{booking.session_type}</p>
                      </div>
                      <span style={{backgroundColor: colors.bg, color: colors.text, fontSize: "12px", padding: "4px 12px", borderRadius: "20px", fontWeight: "500"}}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Date</p>
                        <p className="text-black">{booking.date || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Location</p>
                        <p className="text-black">{booking.location || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Price</p>
                        <p className="text-black">{booking.price}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Booked on</p>
                        <p className="text-black">{new Date(booking.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {booking.message && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-gray-400 text-xs mb-1">Your message</p>
                        <p className="text-gray-600 text-sm">{booking.message}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}