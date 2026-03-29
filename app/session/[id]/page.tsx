"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";

// ✅ ICONS
import { Mic, MicOff, Video, VideoOff, Monitor, Phone } from "lucide-react";

export default function SessionPage() {
  const params = useParams();
  const id = params.id as string;

  const [code, setCode] = useState("// Start coding here...");
  const [socket, setSocket] = useState<any>(null);

  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);

  const hasInitialized = useRef(false);

  const isInitiator =
    typeof window !== "undefined" && window.location.hash === "#init";

  useEffect(() => {
    if (!id || hasInitialized.current) return;
    hasInitialized.current = true;

    if (peerConnection.current) return;

    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.emit("join-session", id);

    newSocket.on("code-update", (newCode: string) => {
      setCode(newCode);
    });

    newSocket.on("receive-message", (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    });

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.current = pc;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;

          // 🔥 CRITICAL FIX (AUTOPLAY)
          localVideoRef.current.onloadedmetadata = () => {
            localVideoRef.current?.play();
          };
        }

        stream.getTracks().forEach((track) => {
          if (
            peerConnection.current &&
            peerConnection.current.signalingState !== "closed"
          ) {
            peerConnection.current.addTrack(track, stream);
          }
        });
      });

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        newSocket.emit("ice-candidate", {
          sessionId: id,
          candidate: event.candidate,
        });
      }
    };

    newSocket.on("offer", async (offer) => {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      newSocket.emit("answer", { sessionId: id, answer });
    });

    newSocket.on("answer", async (answer) => {
      await pc.setRemoteDescription(answer);
    });

    newSocket.on("ice-candidate", async (candidate) => {
      await pc.addIceCandidate(candidate);
    });

    return () => {
      newSocket.disconnect();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      pc.close();
      peerConnection.current = null;
    };
  }, [id]);

  const handleChange = (value: string | undefined) => {
    setCode(value || "");
    socket?.emit("code-change", { sessionId: id, code: value });
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const msgData = {
      text: message,
      time: new Date().toLocaleTimeString(),
      user: username,
    };

    socket?.emit("send-message", {
      sessionId: id,
      message: msgData,
    });

    setMessages((prev) => [...prev, msgData]);
    setMessage("");
  };

  const startCall = async () => {
    const pc = peerConnection.current;
    if (!pc || !socket) return;

    if (!isInitiator) {
      alert("Only initiator can start call");
      return;
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("offer", { sessionId: id, offer });
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = isMuted;
    });

    setIsMuted(!isMuted);
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = isCameraOff;
    });

    setIsCameraOff(!isCameraOff);
  };

  const shareScreen = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = stream.getVideoTracks()[0];

    const sender = peerConnection.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender && screenTrack) sender.replaceTrack(screenTrack);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    screenTrack.onended = () => {
      if (!localStreamRef.current) return;

      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      if (sender && cameraTrack) sender.replaceTrack(cameraTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    };
  };

  if (!joined) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="bg-gray-900 p-6 rounded-xl w-80 text-center">
          <h2 className="text-lg mb-4">Enter your name</h2>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 mb-4"
          />

          <button
            onClick={() => {
              if (!username.trim()) return;
              setJoined(true);
            }}
            className="bg-blue-600 w-full py-2 rounded hover:bg-blue-700"
          >
            Join Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white">

      <div className="flex-1 border-r border-gray-800">
        <Editor height="100%" defaultLanguage="javascript" value={code} onChange={handleChange} />
      </div>

      <div className="w-[350px] flex flex-col backdrop-blur-xl bg-white/5 border-l border-white/10">

        <div className="p-3 border-b border-gray-800">
          <h3 className="text-gray-400 mb-2">Video</h3>

          <div className="bg-black rounded-xl h-40 flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          <div className="flex justify-center gap-3 mt-3">
            <button onClick={startCall} className="bg-green-600 hover:bg-green-700 p-2 rounded-full">
              <Phone size={18} />
            </button>

            <button onClick={toggleMute} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full">
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <button onClick={toggleCamera} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full">
              {isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
            </button>

            <button onClick={shareScreen} className="bg-purple-600 hover:bg-purple-700 p-2 rounded-full">
              <Monitor size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-3">
          <h3 className="text-sm text-gray-400 mb-2">Chat</h3>

          <div className="flex-1 overflow-y-auto space-y-3 p-2">
            {messages.map((msg: any, i) => {
              const isMe = msg.user === username;

              return (
                <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] px-3 py-2 rounded-lg ${isMe ? "bg-blue-600" : "bg-gray-800"}`}>
                    <div className="text-xs opacity-70">
                      {isMe ? "You" : msg.user}
                    </div>
                    <div>{msg.text}</div>
                    <div className="text-[10px] opacity-60 mt-1">
                      {msg.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
            <button onClick={sendMessage} className="btn-blue">
              Send
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}