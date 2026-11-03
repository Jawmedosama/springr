import LoginForm from "@/components/LoginForm";
import { isLang } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <LoginForm lang={isLang(lang) ? lang : "fr"} />;
}
