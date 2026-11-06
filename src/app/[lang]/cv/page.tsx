import CvBuilder from "@/components/CvBuilder";
import { isLang } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <CvBuilder lang={isLang(lang) ? lang : "fr"} />;
}
