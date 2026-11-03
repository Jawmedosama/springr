import ProfileView from "@/components/ProfileView";
import { isLang } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <ProfileView lang={isLang(lang) ? lang : "fr"} />;
}
