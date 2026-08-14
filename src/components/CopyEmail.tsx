"use client";

import { useState } from "react";
import Scramble from "./Scramble";

export default function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="cursor-pointer text-left underline decoration-border underline-offset-4 hover:decoration-foreground"
    >
      <Scramble text={copied ? "copied" : "email"} />
    </button>
  );
}
