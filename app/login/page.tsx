"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMessage(error.message);
    } else {
      window.location.href = "/";
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <a href="/" className="flex justify-center mb-8">
          <span style={{fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#1a1a1a"}}>
            Framio
          </span>
        </a>

        {/* Card */}
        <div className="border border-gray-100 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-black mb-2">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">Log in to your Framio account</p>

          {/* Email */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-2">Email address</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 block mb-2">Password</label>
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black"
            />
            <a href="#" className="text-sm text-gray-400 hover:text-black mt-2 block text-right">
              Forgot password?
            </a>
          </div>

          {/* Message */}
          {message && (
            <div className="mb-4 p-3 rounded-xl bg-gray-50 text-sm text-gray-700">
              {message}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

          <p className="text-center text-gray-400 text-sm mt-4">
            Don't have an account?{" "}
            <a href="/signup" className="text-black font-medium">Sign up</a>
          </p>
        </div>

      </div>
    </main>
  );
}