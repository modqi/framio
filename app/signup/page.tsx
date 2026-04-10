"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("client");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
        emailRedirectTo: role === "photographer"
          ? "https://framio-alpha.vercel.app/photographer-dashboard"
          : "https://framio-alpha.vercel.app/dashboard",
      }
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email to confirm your account! After confirming you will be taken to your dashboard.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <a href="/" className="flex justify-center mb-8">
          <span style={{fontFamily: "Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#1a1a1a"}}>
            Framio
          </span>
        </a>
        <div className="border border-gray-100 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-black mb-2">Create your account</h2>
          <p className="text-gray-500 text-sm mb-8">Join thousands of photographers and clients on Framio</p>
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setRole("client")}
              style={{flex: 1, padding: "10px", borderRadius: "8px", border: role === "client" ? "2px solid #1a1a1a" : "1px solid #e5e5e5", backgroundColor: role === "client" ? "#1a1a1a" : "white", color: role === "client" ? "white" : "#888", fontSize: "14px", fontWeight: "500", cursor: "pointer"}}
            >
              I need a photographer
            </button>
            <button
              onClick={() => setRole("photographer")}
              style={{flex: 1, padding: "10px", borderRadius: "8px", border: role === "photographer" ? "2px solid #1a1a1a" : "1px solid #e5e5e5", backgroundColor: role === "photographer" ? "#1a1a1a" : "white", color: role === "photographer" ? "white" : "#888", fontSize: "14px", fontWeight: "500", cursor: "pointer"}}
            >
              I am a photographer
            </button>
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-2">Full name</label>
            <input type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black"/>
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-2">Email address</label>
            <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black"/>
          </div>
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 block mb-2">Password</label>
            <input type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black"/>
          </div>
          {message && (
            <div className="mb-4 p-3 rounded-xl bg-gray-50 text-sm text-gray-700">{message}</div>
          )}
          <button onClick={handleSignUp} disabled={loading} className="w-full bg-black text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors">
            {loading ? "Creating account..." : "Create account"}
          </button>
          <p className="text-center text-gray-400 text-sm mt-4">
            Already have an account?{" "}
            <a href="/login" className="text-black font-medium">Log in</a>
          </p>
        </div>
      </div>
    </main>
  );
}