/** Logo de l'appli, dessiné pour next/og (écran d'accueil du téléphone). */
export default function AppIcon({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: "#0b3a26" }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="#c9f26b" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 19c3-1 4-4 4-7s2-6 6-6M15 6l-3-3M15 6l-3 3" />
      </svg>
    </div>
  );
}
