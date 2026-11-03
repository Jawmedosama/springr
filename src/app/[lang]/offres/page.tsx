import SwipeDeck from "@/components/SwipeDeck";
import { isLang } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <SwipeDeck lang={isLang(lang) ? lang : "fr"} />;
}
