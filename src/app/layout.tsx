import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: { default: "IA Dev Learn: learn to code with AI agents", template: "%s · IA Dev Learn" },
  description:
    "Learn Claude Code, Codex, Gemini CLI, Antigravity and Orca by doing it: prompts, rules, skills and parallel agents in a safe simulated terminal. In English and French.",
  openGraph: {
    title: "IA Dev Learn: learn to code with AI agents",
    description: "Prompt agents, write rules and skills, and run a team of agents with Orca, in a simulated terminal. Free, no account needed.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f0efe7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="light" className={`${plexSans.variable} ${plexMono.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=JSON.parse(localStorage.getItem("iadevlearn-progress")||"{}").state;if(s&&s.settings){document.documentElement.dataset.theme=s.settings.theme||"light";if(s.settings.locale)document.documentElement.lang=s.settings.locale;if(s.settings.motion==="reduced")document.documentElement.dataset.motion="reduced"}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
