import ShareOfferForm from "@/components/ShareOfferForm";
import { isLang } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <ShareOfferForm lang={isLang(lang) ? lang : "fr"} />;
}
