import NewPassword from "@/components/NewPassword";
import { isLang } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <NewPassword lang={isLang(lang) ? lang : "fr"} />;
}
