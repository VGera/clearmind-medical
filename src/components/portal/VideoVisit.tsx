"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { PRACTICE, PROVIDERS } from "@/lib/data";
import { type Visit } from "@/lib/portal/mock";
import { Avatar, Badge, Button, Card, Icon, inputClass } from "../ui";

/**
 * The real thing: getUserMedia, real device pickers, a real level meter. The
 * pre-join screen is the no-show prevention step — most missed telehealth
 * visits are a camera permission the patient discovers at the appointment time,
 * so this screen exists to find that out while there's still time to fix it.
 *
 * The provider side is a declared simulation. Faking a video of a person would
 * be a lie about what this prototype does.
 */

export type MediaFail = "insecure" | "unsupported" | "denied" | "missing" | "busy" | "other";

export function classifyMediaError(e: unknown): MediaFail {
  const name = typeof e === "object" && e !== null ? String((e as { name?: unknown }).name ?? "") : "";
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "DevicesNotFoundError") return "missing";
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") return "busy";
  return "other";
}

/** The https address this prototype is actually reachable on. */
const SECURE_URL = "https://192.168.53.2:8443";

const TROUBLE: Record<MediaFail, { title: string; body: React.ReactNode }> = {
  insecure: {
    title: "Video needs a secure (https) address",
    body: (
      <>
        Browsers only open the camera and microphone on a secure address, so they&rsquo;re off here. Open the
        portal at <span className="font-medium text-ink">{SECURE_URL}</span> and the video visit works normally.
        Joining by phone works from anywhere.
      </>
    ),
  },
  unsupported: {
    title: "This browser can't open the camera",
    body: <>Chrome, Edge and Safari can, if you have one of them handy. Otherwise join by phone — same visit, same provider.</>,
  },
  denied: {
    title: "The camera and microphone are blocked for this site",
    body: (
      <>
        Easy to turn back on: tap the lock or camera icon in your browser&rsquo;s address bar, set Camera and
        Microphone to Allow, then tap Try again. If you&rsquo;d rather not bother right now, join by phone — it
        works immediately.
      </>
    ),
  },
  missing: {
    title: "We couldn't find a camera or microphone",
    body: <>If you have a headset or webcam, plug it in and tap Try again. Either way, joining by phone gets you into the visit.</>,
  },
  busy: {
    title: "Something else is using your camera",
    body: <>Usually another video app or another browser tab. Close it and tap Try again — or join by phone instead.</>,
  },
  other: {
    title: "The camera didn't start",
    body: <>Tap Try again. If it still won&rsquo;t, join by phone and your provider will be there waiting — you won&rsquo;t lose the slot.</>,
  },
};

/** One place for every camera/mic failure, so the wording can't drift. */
export function MediaTrouble({ kind, onRetry }: { kind: MediaFail; onRetry?: () => void }) {
  const t = TROUBLE[kind];
  const retryable = kind !== "insecure" && kind !== "unsupported";
  return (
    <Card className="border-clay-500/25 bg-tint-sand p-5" role="group">
      <h3 className="font-medium text-ink">{t.title}</h3>
      <p className="mt-1.5 text-[0.95rem] leading-relaxed text-tint-sandInk">{t.body}</p>
      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        {retryable && onRetry && (
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onRetry}>
            Try again
          </Button>
        )}
        <a
          href={PRACTICE.phoneHref}
          className="inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-panel px-5 text-[0.9375rem] font-medium text-slate-600 transition hover:bg-slate-50 sm:w-auto"
        >
          <Icon name="phone" className="h-4 w-4" />
          Join by phone instead
        </a>
      </div>
      <p className="mt-3 text-sm text-tint-sandInk">
        Phone visits count the same. Call {PRACTICE.phone} and say you&rsquo;re joining your appointment.
      </p>
    </Card>
  );
}

/** Why the camera can't be opened at all, before we even ask for it. */
export function mediaBlocked(): MediaFail | null {
  if (typeof window === "undefined") return null;
  if (window.isSecureContext === false) return "insecure";
  if (!navigator.mediaDevices?.getUserMedia) {
    /* The API is simply absent on an insecure origin in most browsers, so say
       the thing the patient can act on rather than "unsupported". */
    return window.isSecureContext ? "unsupported" : "insecure";
  }
  return null;
}

function elapsedLabel(s: number): string {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function VideoVisit({ visit, onLeave }: { visit: Visit; onLeave: () => void }) {
  const provider = PROVIDERS.find((p) => p.id === visit.providerId);
  const providerName = visit.providerName;

  const [joined, setJoined] = useState(false);
  const [starting, setStarting] = useState(true);
  /** Mirrors streamRef so render reacts to the stream arriving. */
  const [ready, setReady] = useState(false);
  const [fail, setFail] = useState<MediaFail | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [level, setLevel] = useState(0);
  const [heard, setHeard] = useState(false);
  const [cams, setCams] = useState<MediaDeviceInfo[]>([]);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [camId, setCamId] = useState("");
  const [micId, setMicId] = useState("");
  const [secs, setSecs] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const preRef = useRef<HTMLVideoElement | null>(null);
  const callRef = useRef<HTMLVideoElement | null>(null);

  const stopMeter = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const ctx = audioCtxRef.current;
    audioCtxRef.current = null;
    if (ctx && ctx.state !== "closed") void ctx.close();
    setLevel(0);
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
    if (preRef.current) preRef.current.srcObject = null;
    if (callRef.current) callRef.current.srcObject = null;
  }, []);

  /* Camera lights that stay on after you navigate away are the bug people
     remember, so teardown is unconditional on unmount. */
  const teardownRef = useRef(() => {});
  teardownRef.current = () => { stopMeter(); stopStream(); };
  useEffect(() => () => teardownRef.current(), []);

  const startMeter = useCallback((s: MediaStream) => {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC || s.getAudioTracks().length === 0) return;
    const ctx = new AC();
    audioCtxRef.current = ctx;
    void ctx.resume();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(s).connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    const tick = () => {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      /* Speech RMS sits around 0.05-0.2, so scale it into something a person
         can see move without the bar pinning at full on a loud room. */
      const next = Math.min(1, Math.sqrt(sum / buf.length) * 5);
      setLevel(next);
      if (next > 0.06) setHeard(true);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const attach = useCallback((s: MediaStream) => {
    if (preRef.current) preRef.current.srcObject = s;
    if (callRef.current) callRef.current.srcObject = s;
  }, []);

  const acquire = useCallback(
    async (wantCam?: string, wantMic?: string) => {
      const blocked = mediaBlocked();
      if (blocked) { setFail(blocked); setStarting(false); return; }
      setStarting(true);
      setFail(null);
      stopMeter();
      stopStream();
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: wantCam ? { deviceId: { exact: wantCam } } : true,
          audio: wantMic ? { deviceId: { exact: wantMic } } : true,
        });
        streamRef.current = s;
        s.getVideoTracks().forEach((t) => { t.enabled = camOn; });
        s.getAudioTracks().forEach((t) => { t.enabled = micOn; });
        attach(s);
        setReady(true);
        setHeard(false);
        startMeter(s);

        /* Device labels are only populated once permission is granted, so this
           has to come after getUserMedia, not before. */
        const list = await navigator.mediaDevices.enumerateDevices();
        setCams(list.filter((d) => d.kind === "videoinput"));
        setMics(list.filter((d) => d.kind === "audioinput"));
        const vId = s.getVideoTracks()[0]?.getSettings().deviceId ?? wantCam ?? "";
        const aId = s.getAudioTracks()[0]?.getSettings().deviceId ?? wantMic ?? "";
        setCamId(vId);
        setMicId(aId);
      } catch (e) {
        setFail(classifyMediaError(e));
      } finally {
        setStarting(false);
      }
    },
    [attach, camOn, micOn, startMeter, stopMeter, stopStream],
  );

  /* Asking for the camera on arrival is the point of the screen: find a problem
     now, not at the appointment time. */
  useEffect(() => { void acquire(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  /* The local <video> is a different element in each phase, so the stream has
     to be re-attached when the phase changes. */
  useEffect(() => {
    const s = streamRef.current;
    if (!s) return;
    const el = joined ? callRef.current : preRef.current;
    if (el && el.srcObject !== s) el.srcObject = s;
  }, [joined, ready]);

  useEffect(() => {
    if (!joined) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [joined]);

  const toggleCam = () => {
    const next = !camOn;
    setCamOn(next);
    streamRef.current?.getVideoTracks().forEach((t) => { t.enabled = next; });
  };
  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = next; });
  };

  const leave = () => { stopMeter(); stopStream(); onLeave(); };

  const live = ready && !fail;

  const selfTile = (ref: React.MutableRefObject<HTMLVideoElement | null>, tall: boolean) => (
    <div className={`relative overflow-hidden rounded-xl2 border border-line bg-slate-700 ${tall ? "aspect-[4/3]" : "aspect-video"}`}>
      {/* muted + playsInline + autoPlay, or mobile browsers refuse to render it */}
      <video
        ref={ref}
        muted
        playsInline
        autoPlay
        aria-label="Your camera"
        className="h-full w-full scale-x-[-1] object-cover"
      />
      {!camOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-700 text-center">
          <Icon name="video" className="h-7 w-7 text-white/70" />
          <p className="text-sm text-white">Your camera is off</p>
        </div>
      )}
      <span className="absolute bottom-2 left-2 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-medium text-white">
        You
      </span>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /* In call                                                           */
  /* ---------------------------------------------------------------- */
  if (joined) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge tone="sage">
            <span className="h-2 w-2 rounded-full bg-sage-500" aria-hidden="true" />
            Connected
          </Badge>
          <p className="text-sm font-medium text-muted" aria-label={`In the visit ${Math.floor(secs / 60)} minutes`}>
            {elapsedLabel(secs)}
          </p>
        </div>

        <h1 className="mt-3 font-serif text-[1.4rem] leading-tight text-ink sm:text-[1.7rem]">
          {visit.kind} with {providerName}
        </h1>

        <Card className="mt-4 overflow-hidden border-slate-200 p-0">
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-slate-50 px-5 text-center">
            {provider ? (
              <Avatar name={provider.name} tint={provider.tint} size={76} />
            ) : (
              <Avatar name="Amara Okafor" tint="#2d5468" size={76} />
            )}
            <div>
              <p className="font-serif text-[1.1rem] text-ink">{providerName}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-sage-600">
                <span className="h-2 w-2 rounded-full bg-sage-500" aria-hidden="true" />
                Connected · audio and video
              </p>
            </div>
          </div>
          <p className="border-t border-line bg-panel px-4 py-3 text-xs leading-relaxed text-muted">
            Simulated for this prototype — there is no provider on the other end. Your own camera and microphone
            below are real.
          </p>
        </Card>

        <div className="mt-3 max-w-[16rem]">{selfTile(callRef, false)}</div>

        {/* Left-aligned so nothing sits under the fixed "Call us" button. */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-line pt-5">
          <button
            type="button"
            onClick={toggleMic}
            aria-pressed={!micOn}
            aria-label={micOn ? "Mute my microphone" : "Unmute my microphone"}
            className={`inline-flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center gap-2 rounded-full border px-4 text-[0.9375rem] font-medium transition ${
              micOn
                ? "border-line bg-panel text-ink hover:bg-slate-50"
                : "border-alert-500 bg-alert-100 text-alert-500"
            }`}
          >
            <Icon name="mic" className="h-5 w-5" />
            {micOn ? "Mute" : "Muted"}
          </button>
          <button
            type="button"
            onClick={toggleCam}
            aria-pressed={!camOn}
            aria-label={camOn ? "Turn my camera off" : "Turn my camera on"}
            className={`inline-flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center gap-2 rounded-full border px-4 text-[0.9375rem] font-medium transition ${
              camOn
                ? "border-line bg-panel text-ink hover:bg-slate-50"
                : "border-alert-500 bg-alert-100 text-alert-500"
            }`}
          >
            <Icon name="video" className="h-5 w-5" />
            {camOn ? "Camera" : "Camera off"}
          </button>
          <Button className="!bg-alert-500 hover:!bg-alert-500/90" onClick={leave}>
            <Icon name="x" className="h-4 w-4" />
            Leave
          </Button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted">
          Sound dropping out? Call us and we&rsquo;ll carry on by phone. Leaving by accident is fine — the room
          stays open and you can rejoin.
        </p>
        {/* A pill, left-aligned: a 44px target, and clear of the fixed "Call us" button. */}
        <a
          href={PRACTICE.phoneHref}
          className="mt-2.5 inline-flex min-h-[2.75rem] items-center gap-2 rounded-full border border-slate-200 bg-panel px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <Icon name="phone" className="h-4 w-4" />
          Call us at {PRACTICE.phone}
        </a>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Pre-join                                                          */
  /* ---------------------------------------------------------------- */
  return (
    <div>
      <button
        onClick={leave}
        className="mb-5 inline-flex min-h-[2.75rem] items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <Icon name="back" className="h-4 w-4" />
        Back to my visit
      </button>

      <h1 className="font-serif text-[1.5rem] leading-tight text-ink sm:text-[1.8rem]">Ready to join?</h1>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
        {providerName} is expecting you. Check you can see yourself and that the microphone bar moves when you
        speak — that way nothing surprises you once the visit starts.
      </p>

      {fail ? (
        <div className="mt-5">
          <MediaTrouble kind={fail} onRetry={() => void acquire(camId || undefined, micId || undefined)} />
        </div>
      ) : (
        <>
          <div className="mt-5">{selfTile(preRef, true)}</div>
          {starting && (
            <p className="mt-2.5 text-sm text-muted" role="status">
              Starting your camera — your browser may ask permission first.
            </p>
          )}

          <Card className="mt-3.5 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-medium text-ink">Microphone</h2>
              {heard ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-600">
                  <Icon name="check" className="h-4 w-4" /> We can hear you
                </span>
              ) : (
                <span className="text-sm text-muted">{micOn ? "Say something" : "Off"}</span>
              )}
            </div>
            <div
              role="meter"
              aria-label="Microphone level"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(level * 100)}
              className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100"
            >
              <div
                className="h-full rounded-full bg-sage-500 transition-[width] duration-75"
                style={{ width: `${Math.round(level * 100)}%` }}
              />
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-muted">
              {micOn
                ? "The green bar follows your voice. If it never moves, try another microphone below."
                : "Your microphone is muted, so the bar won't move. Turn it on to test it."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={toggleCam}
                aria-pressed={!camOn}
                className={`inline-flex min-h-[2.75rem] items-center gap-2 rounded-full border px-4 text-[0.9375rem] font-medium transition ${
                  camOn ? "border-line bg-panel text-ink hover:bg-slate-50" : "border-alert-500 bg-alert-100 text-alert-500"
                }`}
              >
                <Icon name="video" className="h-5 w-5" />
                {camOn ? "Camera on" : "Camera off"}
              </button>
              <button
                type="button"
                onClick={toggleMic}
                aria-pressed={!micOn}
                className={`inline-flex min-h-[2.75rem] items-center gap-2 rounded-full border px-4 text-[0.9375rem] font-medium transition ${
                  micOn ? "border-line bg-panel text-ink hover:bg-slate-50" : "border-alert-500 bg-alert-100 text-alert-500"
                }`}
              >
                <Icon name="mic" className="h-5 w-5" />
                {micOn ? "Mic on" : "Mic off"}
              </button>
            </div>
          </Card>

          <Card className="mt-3.5 p-5">
            <h2 className="font-medium text-ink">Which camera and microphone?</h2>
            <div className="mt-3 space-y-3.5">
              <div>
                <label htmlFor="vv-cam" className="mb-1.5 block text-[0.9375rem] font-medium text-ink">
                  Camera
                </label>
                <select
                  id="vv-cam"
                  value={camId}
                  onChange={(e) => { setCamId(e.target.value); void acquire(e.target.value, micId || undefined); }}
                  className={`${inputClass} min-h-[2.75rem]`}
                >
                  {cams.length === 0 && <option value="">Default camera</option>}
                  {cams.map((d, i) => (
                    <option key={d.deviceId || `cam${i}`} value={d.deviceId}>
                      {d.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="vv-mic" className="mb-1.5 block text-[0.9375rem] font-medium text-ink">
                  Microphone
                </label>
                <select
                  id="vv-mic"
                  value={micId}
                  onChange={(e) => { setMicId(e.target.value); void acquire(camId || undefined, e.target.value); }}
                  className={`${inputClass} min-h-[2.75rem]`}
                >
                  {mics.length === 0 && <option value="">Default microphone</option>}
                  {mics.map((d, i) => (
                    <option key={d.deviceId || `mic${i}`} value={d.deviceId}>
                      {d.label || `Microphone ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Headphones usually help most — they stop the echo.
            </p>
          </Card>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              disabled={!live}
              onClick={() => { setSecs(0); setJoined(true); }}
            >
              <Icon name="video" className="h-5 w-5" />
              Join now
            </Button>
            <a
              href={PRACTICE.phoneHref}
              className="inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-panel px-6 text-[1.0625rem] font-medium text-slate-600 transition hover:bg-slate-50 sm:w-auto"
            >
              <Icon name="phone" className="h-5 w-5" />
              Join by phone instead
            </a>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            A phone visit is the same visit. If video is being difficult, call {PRACTICE.phone} rather than miss
            the appointment.
          </p>
        </>
      )}
    </div>
  );
}
