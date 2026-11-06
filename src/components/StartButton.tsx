"use client";

import { useState } from "react";
import { store } from "@/lib/store";
import type { Lang } from "@/lib/types";
import StartDialog, { type StartMode } from "./StartDialog";

interface Props {
  lang: Lang;
  className?: string;
  mode?: StartMode;
  children: React.ReactNode;
}

/** Ouvre la fenêtre d'accueil. Une personne déjà installée va directement à ses offres. */
export default function StartButton({ lang, className, mode, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={className}
        onClick={() => {
          if (!mode && (store.getProfile() || store.getGuest())) window.location.href = `/${lang}/offres`;
          else setOpen(true);
        }}
      >
        {children}
      </button>
      {open && <StartDialog lang={lang} mode={mode} onClose={() => setOpen(false)} />}
    </>
  );
}
