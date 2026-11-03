import CompanyList from "@/components/CompanyList";
import { isLang } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <CompanyList lang={isLang(lang) ? lang : "fr"} />;
}
