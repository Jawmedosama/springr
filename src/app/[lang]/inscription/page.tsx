import SignupForm from "@/components/SignupForm";
import { isLang } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <SignupForm lang={isLang(lang) ? lang : "fr"} />;
}
