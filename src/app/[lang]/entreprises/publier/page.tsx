import EmployerSpace from "@/components/EmployerSpace";
import { isLang } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <EmployerSpace lang={isLang(lang) ? lang : "fr"} />;
}
