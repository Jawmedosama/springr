import Link from "next/link";
import OfferCard, { initials } from "@/components/OfferCard";
import {
  IconArrow, IconBell, IconBuilding, IconCards, IconGlobe, IconHeart, IconList, IconPen, IconShield, IconTarget, IconX,
} from "@/components/Icons";
import { getDict, isLang } from "@/lib/i18n";
import type { Offer } from "@/lib/types";

/** Cartes d'illustration de la page d'accueil (pas de vraies offres). */
function demoOffers(lang: string): Offer[] {
  const now = new Date().toISOString();
  const nl = lang === "nl";
  return [
    {
      id: "demo-a", title: nl ? "Junior webontwikkelaar" : "Développeur·se web junior", company: "Atelier Pixel",
      city: nl ? "Brussel" : "Bruxelles", region: "bruxelles", contract: "cdi", url: "#", source: "Démo", publishedAt: now,
      salary: nl ? "2 600 tot 3 000 € bruto / maand" : "2 600 à 3 000 € brut / mois",
      description: nl ? "React en Node.js in een klein productteam. Je werkt mee aan de app en de website van klanten." : "React et Node.js dans une petite équipe produit. Tu participes à l'application et aux sites des clients.",
    },
    {
      id: "demo-b", title: nl ? "Stagiair marketing" : "Stagiaire marketing", company: "Maison Verte",
      city: "Liège", region: "wallonie", contract: "stage", url: "#", source: "Démo", publishedAt: now,
      description: nl ? "Sociale media, nieuwsbrief en evenementen, zes maanden." : "Réseaux sociaux, newsletter et événements, six mois.",
    },
  ];
}

const MINI_ICONS = [IconTarget, IconPen, IconList, IconBell, IconGlobe, IconShield];

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = isLang(raw) ? raw : "fr";
  const t = getDict(lang);
  const h = t.home;
  const [a, b] = demoOffers(lang);
  const companies = [
    ["Brasserie du Canal", 6, "Bruxelles"],
    ["Logistiek Noord", 4, "Gent"],
    ["Clinique Saint-Luc", 3, "Namur"],
  ] as const;

  return (
    <main>
      <section className="hero">
        <div className="wrap">
          <span className="kicker"><span className="dot" />{h.kicker}</span>
          <h1>{h.title1}<span className="hl">{h.title2}</span></h1>
          <p className="lead">{h.lead}</p>
          <div className="cta-row">
            <Link className="btn dark big" href={`/${lang}/inscription`}>{h.cta} <IconArrow className="ico" /></Link>
            <Link className="btn big" href={`/${lang}/offres`}>{h.secondary}</Link>
          </div>
          <p className="note">{h.note}</p>
          <div className="hero-demo">
            <div className="demo-stack">
              <OfferCard offer={b} t={t} lang={lang} score={72} className="back" />
              <OfferCard offer={a} t={t} lang={lang} score={91} className="front" />
            </div>
            <div className="deck-actions" style={{ marginTop: 24 }} aria-hidden>
              <span className="icon-btn pass"><IconX /></span>
              <span className="icon-btn keep"><IconHeart /></span>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        <section className="stats">
          {h.stats.map(([n, l]) => (
            <div className="stat" key={l}><b>{n}</b><span>{l}</span></div>
          ))}
        </section>
      </div>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="tag lime">{h.howKicker}</span>
            <h2>{h.howTitle}</h2>
          </div>
          <div className="steps">
            {h.how.map(([title, text], i) => (
              <div className="step" key={title}>
                <span className="step-n">{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt" id="fonctions">
        <div className="wrap">
          <div className="section-head">
            <span className="tag lime">{h.featKicker}</span>
            <h2>{h.featTitle}</h2>
          </div>

          <div className="feature">
            <div className="feature-text">
              <span className="tag"><IconCards className="ico" /> {h.feed.tag}</span>
              <h2 style={{ marginTop: 14 }}>{h.feed.title}</h2>
              <p>{h.feed.text}</p>
              <p className="small">{h.feed.hint}</p>
            </div>
            <div className="feature-visual">
              <OfferCard offer={a} t={t} lang={lang} score={91} style={{ maxWidth: 340, width: "100%" }}>
                <ul className="reasons">
                  <li>{lang === "nl" ? "Het contracttype past bij je" : "Le type de contrat te correspond"}</li>
                  <li>{lang === "nl" ? "In jouw regio" : "Dans ta région"}</li>
                  <li>{lang === "nl" ? "Vaardigheden: react, javascript" : "Compétences : react, javascript"}</li>
                </ul>
              </OfferCard>
            </div>
          </div>

          <div className="feature rev">
            <div className="feature-text">
              <span className="tag"><IconBuilding className="ico" /> {h.hidden.tag}</span>
              <h2 style={{ marginTop: 14 }}>{h.hidden.title}</h2>
              <p>{h.hidden.text}</p>
              <Link className="btn" href={`/${lang}/entreprises`}>{t.nav.companies} <IconArrow className="ico" /></Link>
            </div>
            <div className="feature-visual">
              <div className="company-demo">
                {companies.map(([name, n, city]) => (
                  <div className="company-row" key={name}>
                    <span className="avatar">{initials(name)}</span>
                    <div className="grow">
                      <b>{name}</b>
                      <span className="muted small">{city} · {n} {t.companies.offers}</span>
                    </div>
                    <span className="tag lime">{h.hidden.badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="feature">
            <div className="feature-text">
              <span className="tag"><IconPen className="ico" /> {h.ai.tag}</span>
              <h2 style={{ marginTop: 14 }}>{h.ai.title}</h2>
              <p>{h.ai.text}</p>
            </div>
            <div className="feature-visual">
              <div className="ai-demo">
                {h.ai.steps.map((s) => (
                  <div className="ai-step" key={s}><span className="check">✓</span>{s}</div>
                ))}
                <div className="ai-doc" aria-hidden>
                  <i style={{ width: "40%" }} /><i /><i style={{ width: "85%" }} /><i style={{ width: "92%" }} /><i style={{ width: "60%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="feature rev">
            <div className="feature-text">
              <span className="tag"><IconShield className="ico" /> {h.clean.tag}</span>
              <h2 style={{ marginTop: 14 }}>{h.clean.title}</h2>
              <p>{h.clean.text}</p>
            </div>
            <div className="feature-visual">
              <div className="clean-demo">
                {h.clean.out.map((o) => <div className="row-out" key={o}>{o}<IconX className="ico" /></div>)}
                <div className="row-in">{h.clean.in}<span>✓</span></div>
              </div>
            </div>
          </div>

          <div className="grid6">
            {h.grid.map(([title, text], i) => {
              const Icon = MINI_ICONS[i];
              return (
                <div className="mini" key={title}>
                  <span className="mini-ico"><Icon /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head"><h2>{h.compare.title}</h2></div>
          <div className="compare">
            <div className="old">
              <span className="tag line">{h.compare.oldTag}</span>
              <div className="time">{h.compare.oldTime}</div>
              <ul>{h.compare.old.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <div className="new">
              <span className="tag">{h.compare.newTag}</span>
              <div className="time">{h.compare.newTime}</div>
              <ul>{h.compare.new.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section alt" id="tarifs">
        <div className="wrap">
          <div className="section-head">
            <h2>{h.pricing.title}</h2>
            <p>{h.pricing.lead}</p>
          </div>
          <div className="plans">
            {h.pricing.plans.map((p, i) => (
              <div className={i === 0 ? "plan main" : "plan"} key={p.name}>
                {p.soon && <span className="tag line soon">{h.pricing.soon}</span>}
                <h3>{p.name}</h3>
                <div className="price">{p.price} {p.per && <small>{p.per}</small>}</div>
                <p className="muted" style={{ margin: 0 }}>{p.desc}</p>
                <ul>{p.items.map((x) => <li key={x}>{x}</li>)}</ul>
                {p.soon ? (
                  <button className="btn block" disabled>{p.cta}</button>
                ) : (
                  <Link className="btn brand block" href={`/${lang}/inscription`}>{p.cta}</Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="wrap">
          <div className="section-head"><h2>{h.faqTitle}</h2></div>
          <div className="faq">
            {h.faq.map(([q, r]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <div className="wrap">
        <section className="final">
          <h2>{h.finalTitle}</h2>
          <p>{h.finalLead}</p>
          <Link className="btn lime big" href={`/${lang}/inscription`}>{h.cta} <IconArrow className="ico" /></Link>
        </section>
      </div>
    </main>
  );
}
