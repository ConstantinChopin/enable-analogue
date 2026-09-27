"use client";
/**
 * The door — enter the prototype as someone, somewhere, in one link.
 *
 *   /door?as=user|owner&lab=0|1&to=/records/maison-leandre&ask=What is true about it
 *
 * The roadmap (/roadmap) opens every surface through here, in its panel and full
 * screen: the session starts clean, signed in as the role the surface belongs to, in
 * the lab when the surface is on trial there, and lands on the page. `ask` puts a first
 * question to the assistant (a draft starts its questions). Only paths inside the
 * prototype are followed.
 */
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDemo } from "@/lib/store";
import { askAssistant } from "@/components/assistant";

export default function Door() {
  return (
    <Suspense fallback={null}>
      <Enter />
    </Suspense>
  );
}

function Enter() {
  const { s, d } = useDemo();
  const q = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    /* The store rehydrates in the provider's effect, which runs after this one: act a
       tick later, so a stored session cannot overwrite the one this link asks for. */
    const t = window.setTimeout(() => {
      const role = q?.get("as") === "owner" ? "owner" : "user";
      const lab = q?.get("lab") === "1";
      const want = q?.get("to") ?? "/briefing";
      const to = want.startsWith("/") && !want.startsWith("//") && !want.startsWith("/door") ? want : "/briefing";
      d({ type: "reset" });
      d({ type: "world", world: "v2" });
      d({ type: "signIn", role });
      d({ type: "lab", on: lab });
      const ask = q?.get("ask");
      if (ask) askAssistant(d, { ...s, role, lab, assistantThreads: [], assistantThread: null, createdTravellers: [] }, ask, to.split("?")[0], true);
      router.replace(to);
    }, 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
