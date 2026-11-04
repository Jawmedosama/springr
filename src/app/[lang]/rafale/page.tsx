import Burst from "@/components/Burst";
import { isLang } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Burst lang={isLang(lang) ? lang : "fr"} />;
}
