"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    console.log("Response:", data);

    // ✅ FIX HERE
    alert(data.message || "Registered successfully");

  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
};

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <div className="p-6 w-[300px] bg-gray-900 rounded-xl">
        <h2 className="mb-4 text-lg">Register</h2>

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
          onClick={handleRegister}
          className="w-full bg-green-600 p-2 rounded"
        >
          Register
        </button>
      </div>
    </div>
  );
}