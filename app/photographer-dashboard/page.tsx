"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function PhotographerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
      } else {
        setUser(user);
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Total bookings", value: "0", desc: "All time" },
            { label: "This month", value: "0", desc: "Bookings this month" },
            { label: "Earnings", value: "0 NOK", desc: "Total earnings" },
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
            <span className="text-3xl font-bold">20%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 mb-6">
            <div className="bg-white rounded-full h-2" style={{width: "20%"}}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { task: "Add profile photo", done: false },
              { task: "Write your bio", done: false },
              { task: "Add portfolio photos", done: false },
              { task: "Set your prices", done: false },
              { task: "Add your location", done: true },
            ].map((item) => (
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

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-10">
          <h2 className="text-lg font-bold text-black mb-4">Quick actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: "👤", title: "Edit my profile", desc: "Update your bio, photos and prices", href: "#" },
              { icon: "📅", title: "My bookings", desc: "View and manage booking requests", href: "#" },
              { icon: "🖼️", title: "My portfolio", desc: "Add and manage your photos", href: "#" },
              { icon: "💰", title: "Earnings", desc: "Track your income and payouts", href: "#" },
            ].map((action) => (
              <a key={action.title} href={action.href} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-black transition-colors">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white text-lg flex-shrink-0">
                  {action.icon}
                </div>
                <div>
                  <p className="font-medium text-black">{action.title}</p>
                  <p className="text-gray-400 text-sm">{action.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Booking requests */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-black mb-4">Booking requests</h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-400 text-sm">No booking requests yet</p>
            <p className="text-gray-300 text-xs mt-1">Complete your profile to start receiving bookings</p>
            <button className="mt-6 bg-black text-white text-sm px-6 py-3 rounded-full hover:bg-gray-800">
              Complete my profile
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}