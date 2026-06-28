"use client";

import { useCallback, useState } from "react";

export function useKvkkConsent() {
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [acikRizaAccepted, setAcikRizaAccepted] = useState(false);
  const [legalModal, setLegalModal] = useState<"aydinlatma" | "acik_riza" | null>(
    null
  );

  const isValid = kvkkAccepted && acikRizaAccepted;

  const reset = useCallback(() => {
    setKvkkAccepted(false);
    setAcikRizaAccepted(false);
  }, []);

  return {
    kvkkAccepted,
    acikRizaAccepted,
    setKvkkAccepted,
    setAcikRizaAccepted,
    isValid,
    legalModal,
    openLegalModal: setLegalModal,
    closeLegalModal: () => setLegalModal(null),
    reset,
  };
}
