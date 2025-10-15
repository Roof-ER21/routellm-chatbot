"use client";

import React, { useState } from "react";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";

export default function InlineMic({
  onTranscript,
  className,
}: {
  onTranscript: (text: string) => void;
  className?: string;
}) {
  const [sticky, setSticky] = useState(false);
  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
  } = useVoiceRecognition({
    language: "en-US",
    continuous: false,
    interimResults: true,
    minActiveMs: 1800,
    onFinalResult: (finalTranscript) => {
      const txt = (finalTranscript || "").trim();
      if (txt) onTranscript(txt);
      if (!sticky) stopListening();
    },
  });

  const toggle = async () => {
    if (!isSupported) return;
    if (isListening) {
      setSticky(false);
      stopListening();
    } else {
      setSticky(true);
      await startListening();
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isListening ? "Stop voice" : "Speak"}
      title={isListening ? "Stop" : "Speak"}
      className={
        className ||
        "inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 text-white shadow focus:outline-none"
      }
    >
      <span className={isListening ? "animate-pulse" : ""}>{isListening ? "🎙️" : "🎤"}</span>
    </button>
  );
}

