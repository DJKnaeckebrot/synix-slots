"use client";

import { createClient } from "@/lib/supabase/client";

type Props = {
  className?: string;
};

export function SignOutButton({ className }: Props) {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className={
        className ??
        "rounded border border-white/15 px-3 py-1.5 text-xs uppercase tracking-wider text-white/70 transition hover:border-cyan-400/40 hover:text-cyan-200"
      }
    >
      Sign out
    </button>
  );
}
