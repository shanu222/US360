"use client";

import { useEffect, useState } from "react";
import { voiceFor, type PartnerVoice } from "@/lib/voice";

export function usePartnerVoice(): PartnerVoice {
  const [voice, setVoice] = useState<PartnerVoice>(voiceFor("female"));
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((j) => setVoice(voiceFor(j.data?.partnerGender)))
      .catch(() => {});
  }, []);
  return voice;
}
