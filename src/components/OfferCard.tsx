import type { Dict } from "@/lib/i18n";
import type { Offer } from "@/lib/types";
import { IconPin } from "./Icons";

export function MatchRing({ score, label }: { score: number; label: string }) {
  const tone = score >= 65 ? "" : score >= 40 ? " mid" : " low";
  return (
    <div className={`ring${tone}`} style={{ "--p": score } as React.CSSProperties} aria-label={`${score} % ${label}`}>
      <b>{score}%<small>{label}</small></b>
    </div>
  );
}

export function initials(name: string): string {
  const w = name.replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] ?? "?") + (w[1]?.[0] ?? "")).toUpperCase();
}

export function ago(date: string, t: Dict): string {
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (!Number.isFinite(d) || d <= 0) return t.offers.today;
  return t.offers.daysAgo.replace("{n}", String(d));
}

interface Props {
  offer: Offer;
  t: Dict;
  score?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  handlers?: React.HTMLAttributes<HTMLElement>;
}

export default function OfferCard({ offer, t, score, className = "", style, children, handlers }: Props) {
  return (
    <article className={`card-job ${className}`} style={style} {...handlers}>
      <div className="card-top">
        <div className="card-tags">
          <span className="tag">{t.contracts[offer.contract]}</span>
          <span className="tag line">{ago(offer.publishedAt, t)}</span>
        </div>
        {score !== undefined && <MatchRing score={score} label={t.offers.match} />}
      </div>
      <h3 className="title">{offer.title}</h3>
      <div className="card-company">
        <span className="avatar" aria-hidden>{initials(offer.company || offer.title)}</span>
        <div>
          <b>{offer.company || "—"}</b>
          <span><IconPin className="" />{" "}{offer.city}{offer.region && t.regions[offer.region] !== offer.city ? ` · ${t.regions[offer.region]}` : ""}</span>
        </div>
      </div>
      {offer.salary && <span className="salary">{offer.salary}</span>}
      <p className="card-desc">{offer.description}</p>
      {children}
      <div className="card-foot">
        <span>{t.offers.source} : {offer.source}</span>
      </div>
    </article>
  );
}
