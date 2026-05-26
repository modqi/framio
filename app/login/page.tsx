"use client";
import { useEffect } from "react";

// /login is replaced by the AuthModal. Redirect to homepage and auto-open it.
export default function Login() {
  useEffect(() => {
    window.location.replace("/?auth=login");
  }, []);
  return null;
}
