import ApplicationsList from "@/components/ApplicationsList";
import { isLang } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <ApplicationsList lang={isLang(lang) ? lang : "fr"} />;
}
