import type { Metadata } from "next";
import Moderation from "@/components/Moderation";

export const metadata: Metadata = { robots: { index: false } };

export default function Page() {
  return <Moderation />;
}
