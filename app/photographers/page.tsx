"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function Photographers() {
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getPhotographers = async () => {
      const { data } = await supabase
        .from("photographers")
        .select("*")
        .order("created_at", { ascending: false });
      setPhotographers(data || []);
      setLoading(false);
    };
    getPhotographers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">Loading photographers...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <a href="/" className="text-2xl font-bold text-black" style={{fontFamily: "Georgia, serif"}}>Framio</a>
        <div className="flex items-center gap-4">
          <a href="/photographers" className="text-black font-medium text-sm">Explore</a>
          <a href="#" className="text-gray-600 hover:text-black text-sm">For Photographers</a>
          <a href="/signup" className="bg-black text-white text-sm px-4 py-2 rounded-full hover:bg-gray-800">Sign up</a>
        </div>
      </nav>

      <section className="px-8 py-12 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-black mb-2">Photographers</h2>
        <p className="text-gray-500">Discover talented photographers around the world</p>
      </section>

      <section className="px-8 pb-24 max-w-6xl mx-auto">
        {photographers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">📸</div>
            <p className="text-gray-400 text-lg mb-2">No photographers yet</p>
            <p className="text-gray-300 text-sm mb-8">Be the first photographer to join Framio!</p>
            <a href="/signup" className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 text-sm">
              Join as a photographer
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {photographers.map((p) => (
              <div key={p.id} className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                <div className="bg-gray-100 h-56 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600">
                    {p.name?.[0] || "?"}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-black text-lg">{p.name}</h3>
                    <span className="text-sm text-gray-600">⭐ {p.rating || "New"}</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-1">{p.location || "Location not set"}</p>
                  <p className="text-gray-500 text-sm mb-4">{p.specialty || "Specialty not set"}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-black text-sm">
                      {p.price ? `From ${p.price}` : "Price on request"}
                    </span>
                    <a href={"/photographers/" + p.id} className="bg-black text-white text-sm px-4 py-2 rounded-full hover:bg-gray-800">
                      View Profile
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}