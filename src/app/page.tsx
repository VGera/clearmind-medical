"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CareElsewhere } from "@/components/CareElsewhere";
import { Chat } from "@/components/Chat";
import { DesignNotes } from "@/components/DesignNotes";
import { Shell } from "@/components/Shell";
import { Account } from "@/components/steps/Account";
import { Care } from "@/components/steps/Care";
import { FitCheck } from "@/components/steps/FitCheck";
import { Landing } from "@/components/steps/Landing";
import { Match } from "@/components/steps/Match";
import { Payment } from "@/components/steps/Payment";
import { Done } from "@/components/steps/Done";
import { blockerFor, emptyIntake, type Blocker, type Intake, type Mode, type Step } from "@/lib/types";
import { VoiceProvider } from "@/lib/voice";

const STEP_TITLES: Record<Step, string> = {
  landing: "Online Psychiatrist in Texas — ADHD, Anxiety, Depression",
  fit: "A few quick questions",
  care: "What's going on",
  match: "Your match",
  account: "Your details",
  payment: "Payment",
  done: "You're booked",
  elsewhere: "Mental health resources",
};

/* Kept in sessionStorage, not localStorage: it is scoped to this one tab and
   is gone the moment the tab closes. A reload used to wipe the entire intake
   with no warning and no way back, which for a 5-step form is worse than the
   storage. Nothing is sent anywhere. */
const SAVE_KEY = "cm.intake.v1";

interface Saved { step: Step; intake: Intake; chatOpened: boolean }

function load(): Saved | null {
  try {
    const raw = sessionStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Saved;
    /* Don't restore someone onto a terminal screen. */
    if (!v?.intake || v.step === "done" || v.step === "landing") return null;
    return v;
  } catch {
    return null;
  }
}

function Flow() {
  const [step, setStep] = useState<Step>("landing");
  const [intake, setIntake] = useState<Intake>(emptyIntake);
  const [restored, setRestored] = useState(false);
  const [notes, setNotes] = useState(false);
  /** Set when the footer link opens the resources page without a blocker. */
  const [resourcesOnly, setResourcesOnly] = useState(false);
  /** Chat mounts on first use and then stays mounted, so switching back and
   *  forth between the form and the chat keeps the conversation. */
  const [chatOpened, setChatOpened] = useState(false);
  const [returnTo, setReturnTo] = useState<Step>("landing");

  const patch = useCallback((p: Partial<Intake>) => setIntake((i) => ({ ...i, ...p })), []);

  const blocker: Blocker = resourcesOnly ? null : blockerFor(intake);

  useEffect(() => {
    const v = load();
    if (v) {
      setIntake(v.intake);
      setChatOpened(v.chatOpened);
      setStep(v.step);
      document.title = `${STEP_TITLES[v.step]} | ClearMind Medical`;
    }
    window.history.replaceState({ cmStep: v?.step ?? "landing" }, "");
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      if (step === "landing") sessionStorage.removeItem(SAVE_KEY);
      else sessionStorage.setItem(SAVE_KEY, JSON.stringify({ step, intake, chatOpened }));
    } catch {
      /* Private browsing, or storage disabled. The flow still works. */
    }
  }, [restored, step, intake, chatOpened]);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const s = (e.state as { cmStep?: Step } | null)?.cmStep;
      if (s) go(s, true);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /* A step change replaces all of main. Without a focus move and a title
     update it is completely silent to a screen reader, and keyboard focus
     falls back to <body> on every transition. */
  const go = (s: Step, viaHistory = false) => {
    setResourcesOnly(false);
    setStep(s);
    /* Without this, Back leaves the app entirely and Forward reloads a blank
       landing page with every answer gone. */
    if (!viaHistory && typeof window !== "undefined") {
      window.history.pushState({ cmStep: s }, "");
    }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    document.title = `${STEP_TITLES[s]} | ClearMind Medical`;
    requestAnimationFrame(() => {
      /* The hidden half of the form/chat pair also has an h1; focus the one
         that's actually on screen. */
      const all = Array.from(document.querySelectorAll<HTMLElement>("main h1"));
      (all.find((el) => el.offsetParent !== null) ?? all[0])?.focus();
    });
  };

  const openResources = () => {
    setReturnTo(step);
    setResourcesOnly(true);
    setStep("elsewhere");
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => document.querySelector<HTMLElement>("main h1")?.focus());
  };

  const setMode = (m: Mode) => {
    patch({ mode: m });
    if (m === "chat") {
      setChatOpened(true);
      return;
    }
    /* Land on the first screen that still needs something. */
    const needsFit =
      intake.state !== "TX" || (intake.adult !== true && !intake.ageDeferred) || !intake.carrier;
    go(needsFit ? "fit" : "care");
  };

  /** "Change my answer" from the resources page clears whatever blocked them. */
  const unblock = () => {
    if (resourcesOnly) { setResourcesOnly(false); go(returnTo); return; }
    const b = blockerFor(intake);
    /* Anything discovered under the old answer has to go with it. Leaving
       memberId behind put a Medicare member ID on a BCBS plan, and it passed
       validation. */
    const clearPlan = {
      carrier: null,
      otherPayer: null,
      memberId: "",
      discovery: null,
      eligibility: null,
      insuranceSource: null,
      selfPay: false,
    } as Partial<Intake>;
    if (b === "state") { patch({ state: "", adult: null, ...clearPlan }); go("fit"); return; }
    if (b === "minor") {
      /* Only the age was wrong. Clearing the plan too cost an adult who
         fat-fingered their birth year three steps of work. */
      patch({ adult: null, account: { ...intake.account, dob: "" } });
      go("fit");
      return;
    }
    if (b === "medicare" || b === "medicaid") patch(clearPlan);
    go("fit");
  };

  const backFor: Partial<Record<Step, Step>> = {
    care: "fit",
    match: "care",
    account: "match",
    payment: "account",
  };

  const onIntakeStep = step === "fit" || step === "care";
  const chatMode = intake.mode === "chat" && onIntakeStep;

  /* In chat the whole intake happens without a navigation, so `step` stayed on
     "fit" while Mira asked the care questions — seven exchanges all labelled
     "Step 1 of 5". Derive the rail from what's actually been answered. */
  useEffect(() => {
    if (!chatMode) return;
    const fitDone =
      Boolean(intake.state) && (intake.adult !== null || intake.ageDeferred) && Boolean(intake.carrier);
    const want: Step = fitDone ? "care" : "fit";
    if (want !== step) {
      setStep(want);
      document.title = `${STEP_TITLES[want]} | ClearMind Medical`;
    }
  }, [chatMode, intake.state, intake.adult, intake.ageDeferred, intake.carrier, step]);

  return (
    <>
      <Shell
        step={step}
        mode={intake.mode}
        onMode={setMode}
        onHome={() => go("landing")}
        onBack={step === "fit" ? () => go("landing") : backFor[step] ? () => go(backFor[step]!) : undefined}
        onNotes={() => setNotes(true)}
        onResources={openResources}
      >
        {step === "landing" && (
          <Landing
            onStart={(m) => {
              patch({ mode: m });
              if (m === "chat") setChatOpened(true);
              go("fit");
            }}
          />
        )}

        {onIntakeStep && (
          /* Both halves stay mounted so neither loses its place when you
             switch; only one is shown. */
          <div className={chatMode ? "hidden" : undefined}>
            {step === "fit" ? (
              <FitCheck
                intake={intake}
                patch={patch}
                onContinue={() => go("care")}
                onElsewhere={() => go("elsewhere")}
                onSelfPay={() => {
                  patch({ otherPayer: "selfpay", selfPay: true });
                  go("care");
                }}
              />
            ) : (
              <Care intake={intake} patch={patch} onContinue={() => go("match")} />
            )}
          </div>
        )}

        {/* Mounted for the rest of the session once opened, not just while an
            intake step is showing. Unmounting it threw away the transcript on
            the resources detour, and made "Back" from the match screen remount
            a chat that immediately re-completed itself. */}
        {chatOpened && (
          <div className={chatMode ? undefined : "hidden"}>
            <Chat
              active={chatMode}
              intake={intake}
              patch={patch}
              onComplete={() => go("match")}
              onElsewhere={() => go("elsewhere")}
              onSwitchToForm={() => setMode("form")}
            />
          </div>
        )}

        {step === "match" && (
          <Match intake={intake} patch={patch} onContinue={() => go("account")} onEditCare={() => go("care")} />
        )}

        {step === "account" && (
          <Account
            intake={intake}
            patch={patch}
            onContinue={() => go("payment")}
            onElsewhere={() => go("elsewhere")}
          />
        )}

        {step === "payment" && <Payment intake={intake} patch={patch} onConfirm={() => go("done")} />}

        {step === "done" && (
          <Done
            intake={intake}
            patch={patch}
            onRestart={() => {
              setIntake(emptyIntake);
              setChatOpened(false);
              go("landing");
            }}
          />
        )}

        {step === "elsewhere" && (
          <CareElsewhere
            blocker={blocker}
            intake={intake}
            onBack={unblock}
            onSelfPay={() => {
              patch({ otherPayer: "selfpay", selfPay: true });
              go("care");
            }}
          />
        )}
      </Shell>

      {notes && <DesignNotes onClose={() => setNotes(false)} />}
    </>
  );
}

export default function Page() {
  return (
    <VoiceProvider>
      <Flow />
    </VoiceProvider>
  );
}
