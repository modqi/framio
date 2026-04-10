"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function PhotographerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [completion, setCompletion] = useState(0);
  const [tasks, setTasks] = useState([
    { task: "Add profile photo", done: false },
    { task: "Write your bio", done: false },
    { task: "Add portfolio photos", done: false },
    { task: "Set your prices", done: false },
    { task: "Add your location", done: false },
  ]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
      } else {
        setUser(user);
        const meta = user.user_metadata;
        const updatedTasks = [
          { task: "Add profile photo", done: false },
          { task: "Write your bio", done: !!meta?.bio },
          { task: "Add portfolio photos", done: false },
          { task: "Set your prices", done: !!meta?.price },
          { task: "Add your location", done: !!meta?.location },
        ];
        setTasks(updatedTasks);
        const done = updatedTasks.filter(t => t.done).length;
        setCompletion(Math.round((done / updatedTasks.length) * 100));

        const { data } = await supabase
          .from("bookings")
          .select("*")
          .eq("photographer_name", meta?.name)
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

  const handleBookingStatus = async (id: string, status: string) => {
    await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);
    setBookings(prev =>
      prev.map(b => b.id === id ? { ...b, status } : b)
    );
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
            {user?.user_metadata?.name || user?.email} 📸
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
            Your photography business 📸
          </h1>
          <p className="text-gray-500">Manage your profile, bookings and earnings all in one place.</p>
        </div>

        {/* Profile summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400 flex-shrink-0">
            {user?.user_metadata?.name?.[0] || "?"}
          </div>
          <div className="flex-1">
            <p className="font-bold text-black text-lg">{user?.user_metadata?.name || "Your name"}</p>
            <p className="text-gray-400 text-sm">{user?.user_metadata?.location || "No location set"}</p>
            <p className="text-gray-400 text-sm">{user?.user_metadata?.specialty || "No specialty set"} {user?.user_metadata?.price ? `— ${user?.user_metadata?.price}` : ""}</p>
          </div>
          <a href="/photographer-dashboard/edit-profile" className="text-sm text-black border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-50">
            Edit profile
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Total bookings", value: bookings.length.toString(), desc: "All time" },
            { label: "Pending", value: bookings.filter(b => b.status === "pending").length.toString(), desc: "Awaiting response" },
            { label: "Confirmed", value: bookings.filter(b => b.status === "confirmed").length.toString(), desc: "Confirmed sessions" },
            { label: "Rating", value: "—", desc: "Average rating" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-6 border border-gray-100">
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-black mb-1">{stat.value}</p>
              <p className="text-gray-400 text-xs">{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Profile completion */}
        <div className="bg-black text-white rounded-2xl p-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold mb-1">Complete your profile</h2>
              <p className="text-gray-400 text-sm">A complete profile gets 3x more bookings</p>
            </div>
            <span className="text-3xl font-bold">{completion}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 mb-6">
            <div className="bg-white rounded-full h-2 transition-all" style={{width: `${completion}%`}}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.map((item) => (
              <div key={item.task} className="flex items-center gap-3">
                <div style={{width: "20px", height: "20px", borderRadius: "50%", backgroundColor: item.done ? "white" : "transparent", border: item.done ? "none" : "1px solid #555", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
                  {item.done && <span style={{color: "black", fontSize: "12px"}}>✓</span>}
                </div>
                <span style={{fontSize: "14px", color: item.done ? "#aaa" : "white", textDecoration: item.done ? "line-through" : "none"}}>
                  {item.task}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Requests */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-black mb-6">Booking requests</h2>

          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-400 text-sm">No booking requests yet</p>
              <p className="text-gray-300 text-xs mt-1">Complete your profile to start receiving bookings</p>
              <a href="/photographer-dashboard/edit-profile" className="mt-6 bg-black text-white text-sm px-6 py-3 rounded-full hover:bg-gray-800">
                Complete my profile
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
                        <p className="font-bold text-black text-lg">{booking.client_name}</p>
                        <p className="text-gray-500 text-sm">{booking.client_email}</p>
                      </div>
                      <span style={{backgroundColor: colors.bg, color: colors.text, fontSize: "12px", padding: "4px 12px", borderRadius: "20px", fontWeight: "500"}}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Session type</p>
                        <p className="text-black">{booking.session_type}</p>
                      </div>
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
                    </div>
                    {booking.message && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                        <p className="text-gray-400 text-xs mb-1">Message from client</p>
                        <p className="text-gray-600 text-sm">{booking.message}</p>
                      </div>
                    )}
                    {booking.status === "pending" && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleBookingStatus(booking.id, "confirmed")}
                          className="flex-1 bg-black text-white py-2 rounded-xl text-sm font-medium hover:bg-gray-800"
                        >
                          Accept booking
                        </button>
                        <button
                          onClick={() => handleBookingStatus(booking.id, "declined")}
                          className="flex-1 bg-white text-black py-2 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50"
                        >
                          Decline
                        </button>
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