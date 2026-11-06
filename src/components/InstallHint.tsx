"use client";

import { useEffect, useState } from "react";

const KEY = "springr.installHint";

/** Sur iPhone, Safari ne propose pas l'installation : on explique le geste une fois. */
export default function InstallHint({ text, close }: { text: string; close: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad/i.test(navigator.userAgent);
    const installed = window.matchMedia("(display-mode: standalone)").matches;
    try {
      setShow(ios && !installed && !localStorage.getItem(KEY));
    } catch {
      setShow(false);
    }
  }, []);

  if (!show) return null;
  return (
    <p className="banner ok">
      {text}{" "}
      <button
        className="link-btn small"
        onClick={() => {
          setShow(false);
          try {
            localStorage.setItem(KEY, "1");
          } catch {
            /* stockage indisponible */
          }
        }}
      >
        {close}
      </button>
    </p>
  );
}
