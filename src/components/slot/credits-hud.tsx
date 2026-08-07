import { formatEuro } from "@/lib/format-euro";

type Props = {
  credits: number;
  username?: string | null;
};

export function CreditsHud({ credits, username }: Props) {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-[10px] uppercase tracking-[0.35em] text-violet-200/60">
        Balance
      </span>
      <div className="rounded-lg border border-violet-400/25 bg-black/50 px-4 py-2 text-right">
        <div className="font-mono text-xl font-semibold text-violet-100 sm:text-2xl">
          {formatEuro(credits)}
        </div>
        {username ? (
          <div className="mt-0.5 max-w-[10rem] truncate text-xs text-white/45">
            {username}
          </div>
        ) : null}
      </div>
    </div>
  );
}
