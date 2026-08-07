"use client";

import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Props = {
  className?: string;
  label?: string;
};

export function DiscordSignInButton({
  className,
  label = "Sign in with Discord",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  async function signIn() {
    setError(null);
    if (!configured) {
      setError(
        "Supabase is not configured. Copy .env.local.example to .env.local.",
      );
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: `${origin}/auth/callback?next=/play`,
        },
      });
      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={signIn}
        disabled={loading}
        className={
          className ??
          "rounded-md bg-[#5865F2] px-6 py-3 font-semibold text-white transition hover:bg-[#4752c4] disabled:opacity-60"
        }
      >
        {loading ? "Connecting…" : label}
      </button>
      {error ? (
        <p className="max-w-sm text-center text-sm text-rose-300">{error}</p>
      ) : null}
    </div>
  );
}
