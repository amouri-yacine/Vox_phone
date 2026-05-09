// Wrapper React autour de l'API Web Speech (SpeechRecognition).
// Marche sur Chrome / Edge / Android. Sur iOS Safari le support est partiel.

import { useCallback, useEffect, useRef, useState } from "react";

type SR = any;

function getSpeechRecognition(): SR | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export interface UseSpeechRecognitionOptions {
  lang?: string; // ex: "fr-FR" ou "en-US"
  continuous?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (err: string) => void;
}

export function useSpeechRecognition(opts: UseSpeechRecognitionOptions = {}) {
  const { lang = "fr-FR", continuous = true, onResult, onError } = opts;
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<any>(null);
  const wantOnRef = useRef(false);

  // Stocke les callbacks dans des refs pour eviter de recreer la reco
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = continuous;
    rec.interimResults = true;

    rec.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interimText += res[0].transcript;
      }
      const text = (finalText || interimText).trim();
      if (text) {
        setTranscript(text);
        onResultRef.current?.(text, Boolean(finalText));
      }
    };

    rec.onerror = (e: any) => {
      onErrorRef.current?.(e?.error || "speech-error");
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        wantOnRef.current = false;
        setListening(false);
      }
    };

    rec.onend = () => {
      // Auto restart si on est cense ecouter (Chrome coupe apres ~60s)
      if (wantOnRef.current) {
        try { rec.start(); } catch { /* deja demarre */ }
      } else {
        setListening(false);
      }
    };

    recRef.current = rec;
    return () => {
      wantOnRef.current = false;
      try { rec.stop(); } catch { /* ignore */ }
      recRef.current = null;
    };
  }, [lang, continuous]);

  const start = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    wantOnRef.current = true;
    try {
      rec.start();
      setListening(true);
    } catch {
      // deja en cours
      setListening(true);
    }
  }, []);

  const stop = useCallback(() => {
    const rec = recRef.current;
    wantOnRef.current = false;
    try { rec?.stop(); } catch { /* ignore */ }
    setListening(false);
  }, []);

  return { supported, listening, transcript, start, stop };
}
