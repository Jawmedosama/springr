import type { Dict } from "@/lib/i18n";

/** Ces sites n'ouvrent pas leurs offres : on ouvre simplement la même recherche chez eux. */
export default function SearchElsewhere({ t, what, where }: { t: Dict; what: string; where: string }) {
  const q = encodeURIComponent(what);
  const l = encodeURIComponent(where);
  const links = [
    ["LinkedIn", `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${encodeURIComponent(where ? `${where}, Belgique` : "Belgique")}`],
    ["Indeed", `https://be.indeed.com/jobs?q=${q}&l=${l}`],
    ["StudentJob", `https://www.studentjob.be/vacatures?search%5Bkeywords_scope%5D=${q}`],
  ];
  return (
    <div className="elsewhere">
      <span className="muted small">{t.offers.elsewhere}</span>
      <div className="chips">
        {links.map(([name, url]) => (
          <a key={name} className="chip" href={url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>{name} ↗</a>
        ))}
      </div>
    </div>
  );
}
