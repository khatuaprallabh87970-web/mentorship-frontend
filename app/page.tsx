"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div style={{ padding: "20px" }}>
      <h1>Mentorship Platform</h1>

      <button
        onClick={() => router.push("/session/test123")}
        style={{ marginTop: "20px", padding: "10px" }}
      >
        Join Session
      </button>
    </div>
  );
}