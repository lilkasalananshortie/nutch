import { useState } from "react";
import { useSettings } from "../stores/settings";

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { settings, update } = useSettings();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const finish = async () => {
    setSaving(true);
    await update({ onboardingCompleted: true });
    setSaving(false);
    onComplete();
  };
  return <section className="onboarding-panel" aria-labelledby="onboarding-title">
    <div className="onboarding-progress" aria-label={`Setup step ${step + 1} of 4`}><i style={{ width: `${(step + 1) / 4 * 100}%` }} /></div>
    {step === 0 && <><span className="onboarding-mark">N</span><h1 id="onboarding-title">Welcome to Nutch</h1><p>A quiet, top-center command surface for Windows.</p><button className="primary-button" onClick={() => setStep(1)}>Set up Nutch</button></>}
    {step === 1 && <><h1 id="onboarding-title">Choose your surface</h1><p>Change this later from Settings.</p><div className="onboarding-options"><button className={settings.displayStyle === "notch" ? "selected" : ""} onClick={() => void update({ displayStyle: "notch" })}><strong>Notch</strong><small>Connected to the top edge</small></button><button className={settings.displayStyle === "island" ? "selected" : ""} onClick={() => void update({ displayStyle: "island" })}><strong>Island</strong><small>Floating with a small gap</small></button></div><button className="primary-button" onClick={() => setStep(2)}>Continue</button></>}
    {step === 2 && <><h1 id="onboarding-title">How should it open?</h1><p>Choose the interaction that feels natural to you.</p><div className="onboarding-options"><button className={settings.hoverToExpand ? "selected" : ""} onClick={() => void update({ hoverToExpand: !settings.hoverToExpand })}><strong>Hover to expand</strong><small>Reveal controls when your pointer enters</small></button><button className={settings.clickToExpand ? "selected" : ""} onClick={() => void update({ clickToExpand: !settings.clickToExpand })}><strong>Click to expand</strong><small>Open the island intentionally</small></button></div><button className="primary-button" onClick={() => setStep(3)}>Continue</button></>}
    {step === 3 && <><h1 id="onboarding-title">You’re ready</h1><p>Optional features stay off until you enable them. You can change everything from Settings.</p><div className="onboarding-summary"><span>Media integration</span><b>Ready</b><span>Planner reminders</span><b>Local</b><span>Clipboard history</span><b>Disabled</b><span>AI</span><b>Not configured</b></div><button className="primary-button" disabled={saving} onClick={() => void finish()}>{saving ? "Saving…" : "Start using Nutch"}</button></>}
    {step > 0 && <button className="quiet-button" onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</button>}
  </section>;
}
