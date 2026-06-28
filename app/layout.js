import "./globals.css";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import ScrollReveal from "../components/client/ScrollReveal";
import TournamentChatbot from "../components/client/TournamentChatbot";
import { platform } from "../lib/tournament";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://cricket-tournament-snowy.vercel.app"),
  title: {
    default: `${platform.name} | Tournament Hosting App`,
    template: `%s | ${platform.shortName}`
  },
  description: platform.description,
  openGraph: {
    title: platform.name,
    description: platform.description,
    images: [platform.heroImage]
  },
  icons: {
    icon: "/assets/sports-arena-icon-v2.png",
    apple: "/assets/sports-arena-apple-icon-v2.png"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ScrollReveal />
        <SiteHeader />
        {children}
        <SiteFooter />
        <TournamentChatbot />
      </body>
    </html>
  );
}
