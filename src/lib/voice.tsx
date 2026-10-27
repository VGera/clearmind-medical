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
/** Why the mic isn't offered, when it isn't. */
export type MicBlock = "insecure" | "unsupported" | "off" | null;

interface VoiceCtx {
  ready: boolean;
  sttSupported: boolean;
  micBlocked: MicBlock;
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
  const [micBlocked, setMicBlocked] = useState<MicBlock>(null);
  const [listening, setListening] = useState(false);
  const [target, setTarget] = useState<string | null>(null);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const handlerRef = useRef<ResultHandler | null>(null);
  /** Finalised text keyed by result index, so a re-delivered result can't double up. */
  const finalsRef = useRef<string[]>([]);

  useEffect(() => {
    let off = false;
    try {
      off = new URLSearchParams(window.location.search).get("novoice") === "1";
    } catch {
      /* noop */
    }
    try {
      const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
      const ctor = Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
      /* The constructor exists on an insecure origin but the microphone does
         not, so checking for it alone renders a button that always fails.
         Browsers only grant the mic on https or localhost. */
      const secure = window.isSecureContext !== false;
      if (off) setMicBlocked("off");
      else if (!ctor) setMicBlocked("unsupported");
      else if (!secure) setMicBlocked("insecure");
      else setMicBlocked(null);
      setStt(!off && ctor && secure);
    } catch {
      setMicBlocked("unsupported");
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
        finalsRef.current = [];

        rec.onstart = () => { setListening(true); setTarget(nextTarget); };
        rec.onresult = (e: SREvent) => {
          let live = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            /* Assign by index rather than concatenate: Chrome may re-deliver a
               result that is already final, and appending would duplicate it. */
            if (r.isFinal) finalsRef.current[i] = r[0].transcript;
            else live += r[0].transcript;
          }
          /* Show what has been recognised SO FAR, not just the fragment still
             in flight. As soon as a phrase is finalised it leaves `live`, so
             publishing `live` alone made the text appear and vanish — and with
             continuous recognition nothing is committed until the user stops,
             so the field looked dead the whole time they were speaking. */
          const soFar = `${finalsRef.current.join("")}${live}`.replace(/\s+/g, " ").trimStart();
          setInterim(soFar);
          if (soFar) handlerRef.current?.(soFar, false);
        };
        rec.onerror = (e: SRErrorEvent) => {
          if (e.error === "not-allowed" || e.error === "service-not-allowed") {
            setError("Your browser blocked the microphone. Allow mic access, or type instead.");
          } else if (e.error === "no-speech") {
            setError("I didn't hear anything. Tap the mic and try again, or type it.");
          } else if (e.error === "audio-capture") {
            setError("No microphone was found. Check which input your browser is using, or type instead.");
          } else if (e.error === "network") {
            /* Chrome streams audio to a Google service; this is the failure
               when it can't reach it, and it has nothing to do with the mic. */
            setError("Voice typing couldn't reach the speech service. Typing works — or try again in a moment.");
          } else if (e.error !== "aborted") {
            setError(`The microphone stopped unexpectedly (${e.error}). You can type instead.`);
          }
          setListening(false);
          setTarget(null);
        };
        rec.onend = () => {
          setListening(false);
          setTarget(null);
          setInterim("");
          const finalText = finalsRef.current.join("").replace(/\s+/g, " ").trim();
          if (finalText) handlerRef.current?.(finalText, true);
          finalsRef.current = [];
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
    () => ({ ready, sttSupported, micBlocked, listening, target, interim, error, startListening, stopListening }),
    [ready, sttSupported, micBlocked, listening, target, interim, error, startListening, stopListening],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVoice(): VoiceCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useVoice must be used inside VoiceProvider");
  return v;
}
