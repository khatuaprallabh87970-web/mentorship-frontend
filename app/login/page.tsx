"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const res = await fetch("https://mentorship-backend-f22x.onrender.com/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    // save username
    localStorage.setItem("username", data.username);

    // go to session
    router.push("/session/test123");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <div className="p-6 w-[300px] bg-gray-900 rounded-xl">
        <h2 className="mb-4 text-lg">Login</h2>

        <input
          placeholder="Username"
          className="w-full mb-2 p-2 bg-gray-800 rounded"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-2 bg-gray-800 rounded"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 p-2 rounded"
        >
          Login
        </button>
      </div>
    </div>
  );
}