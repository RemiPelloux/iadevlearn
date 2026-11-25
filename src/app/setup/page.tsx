import type { Metadata } from "next";
import { AppNav } from "@/components/app-nav";
import { SetupGuide } from "@/features/setup/setup-guide";

export const metadata: Metadata = { title: "Install the tools" };

export default function SetupPage() {
  return (
    <>
      <AppNav />
      <main>
        <SetupGuide />
      </main>
    </>
  );
}
