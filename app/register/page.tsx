"use client";

import { useState } from "react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");

  const handleRegister = async () => {
    const res = await fetch("https://mentorship-backend-f22x.onrender.com/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, name, role }),
    });

    const data = await res.json();
    alert(data.message || data.error);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <div className="p-6 w-[300px] bg-gray-900 rounded-xl">
        <h2 className="mb-4 text-lg">Register</h2>

        <input placeholder="Name" className="w-full mb-2 p-2 bg-gray-800 rounded" onChange={(e) => setName(e.target.value)} />
        <input placeholder="Email" className="w-full mb-2 p-2 bg-gray-800 rounded" onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" className="w-full mb-2 p-2 bg-gray-800 rounded" onChange={(e) => setPassword(e.target.value)} />

        <select className="w-full mb-4 p-2 bg-gray-800 rounded" onChange={(e) => setRole(e.target.value)}>
          <option value="student">Student</option>
          <option value="mentor">Mentor</option>
        </select>

        <button onClick={handleRegister} className="w-full bg-green-600 p-2 rounded">
          Register
        </button>
      </div>
    </div>
  );
}