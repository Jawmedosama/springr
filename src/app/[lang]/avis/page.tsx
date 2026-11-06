import Feedback from "@/components/Feedback";
import { isLang } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Feedback lang={isLang(lang) ? lang : "fr"} />;
}
