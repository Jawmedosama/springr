import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <div className="empty">
        <h1 style={{ margin: 0 }}>404</h1>
        <p style={{ margin: 0 }}>Page introuvable · Pagina niet gevonden</p>
        <Link className="btn dark" href="/fr/offres">Voir les offres</Link>
      </div>
    </main>
  );
}
