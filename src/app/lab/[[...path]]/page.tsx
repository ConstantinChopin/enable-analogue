"use client";
/* The lab's door: /lab switches the itinerary builder on trial on for the session and
   lands on the trips; /lab/briefing lands on the Briefing. The frame bar switches back
   to live. */
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDemo } from "@/lib/store";

export default function LabDoor() {
  const { d } = useDemo();
  const router = useRouter();
  const params = useParams<{ path?: string[] }>();
  const to = "/" + (params?.path?.join("/") || "itineraries");
  useEffect(() => {
    d({ type: "lab", on: true });
    router.replace(to);
  }, [d, router, to]);
  return null;
}
