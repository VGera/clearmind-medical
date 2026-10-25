"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

/* Minimal typings for the Web Speech API (not in lib.dom for all TS versions). */
interface SRAlternative { transcript: string; confidence: number }
interface SRResult { 0: SRAlternative; isFinal: boolean; length: number }
interface SRResultList { length: number; [i: number]: SRResult }
interface SREvent extends Event { resultIndex: number; results: SRResultList }
interface SRErrorEvent extends Event { error: string }
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SRCtor = new () => SpeechRecognitionLike;

export type ResultHandler = (text: string, isFinal: boolean) => void;

/**
 * Dictation only.
 *
 * The app does not speak. Speech synthesis was removed: the voices available on
 * a given device range from warm to robotic with no way to guarantee which, and
 * a flat machine voice reading questions to someone in distress is worse than
 * silence. What's left is the half that works reliably everywhere — a
 * microphone for typing free text, where speaking really is easier than typing.
 *
 * ?novoice=1 disables the microphone too.
 */
interface VoiceCtx {
  ready: boolean;
  sttSupported: boolean;
  listening: boolean;
  /** Which mic is active, e.g. "symptoms" or "chat". */
  target: string | null;
  interim: string;
  error: string | null;
  startListening: (target: string, onResult: ResultHandler, opts?: { continuous?: boolean }) => void;
  stopListening: () => void;
}

const Ctx = createContext<VoiceCtx | null>(null);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [sttSupported, setStt] = useState(false);
  const [listening, setListening] = useState(false);
  const [target, setTarget] = useState<string | null>(null);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const handlerRef = useRef<ResultHandler | null>(null);
  const finalRef = useRef("");

  useEffect(() => {
    let off = false;
    try {
      off = new URLSearchParams(window.location.search).get("novoice") === "1";
    } catch {
      /* noop */
    }
    try {
      if (!off) {
        const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
        setStt(Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition));
      }
    } catch {
      /* no recognition support — typing still works everywhere */
    }
    try {
      /* Left over from the removed read-aloud feature. */
      localStorage.removeItem("cmp.readAloud");
      localStorage.removeItem("cmp.voice");
      localStorage.removeItem("cmp.pitch");
    } catch {
      /* private mode */
    }
    setReady(true);
    return () => {
      try { recRef.current?.abort(); } catch { /* noop */ }
    };
  }, []);

  const stopListening = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* noop */ }
    setListening(false);
    setTarget(null);
    setInterim("");
  }, []);

  const startListening = useCallback(
    (nextTarget: string, onResult: ResultHandler, opts?: { continuous?: boolean }) => {
      setError(null);
      try {
        const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
        const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
        if (!Ctor) {
          setError("This browser can't listen yet. Chrome or Edge works — or just type instead.");
          return;
        }
        try { recRef.current?.abort(); } catch { /* noop */ }

        const rec = new Ctor();
        rec.lang = "en-US";
        /* Free text needs to survive a pause mid-sentence. */
        rec.continuous = opts?.continuous ?? false;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        handlerRef.current = onResult;
        finalRef.current = "";

        rec.onstart = () => { setListening(true); setTarget(nextTarget); };
        rec.onresult = (e: SREvent) => {
          let live = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) finalRef.current += r[0].transcript;
            else live += r[0].transcript;
          }
          setInterim(live);
          if (finalRef.current) handlerRef.current?.(finalRef.current.trim(), false);
        };
        rec.onerror = (e: SRErrorEvent) => {
          if (e.error === "not-allowed" || e.error === "service-not-allowed") {
            setError("Your browser blocked the microphone. Allow mic access, or type instead.");
          } else if (e.error === "no-speech") {
            setError("I didn't hear anything. Tap the mic and try again, or type it.");
          } else if (e.error !== "aborted") {
            setError("The microphone stopped unexpectedly. You can type instead.");
          }
          setListening(false);
          setTarget(null);
        };
        rec.onend = () => {
          setListening(false);
          setTarget(null);
          setInterim("");
          const finalText = finalRef.current.trim();
          if (finalText) handlerRef.current?.(finalText, true);
          finalRef.current = "";
        };

        recRef.current = rec;
        rec.start();
      } catch {
        setError("Couldn't start the microphone. Try again, or type instead.");
        setListening(false);
        setTarget(null);
      }
    },
    [],
  );

  const value = useMemo<VoiceCtx>(
    () => ({ ready, sttSupported, listening, target, interim, error, startListening, stopListening }),
    [ready, sttSupported, listening, target, interim, error, startListening, stopListening],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVoice(): VoiceCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useVoice must be used inside VoiceProvider");
  return v;
}
