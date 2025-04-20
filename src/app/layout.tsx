import "~/styles/globals.css";

import { Newsreader, Figtree, Inter, Red_Hat_Display }  from "next/font/google"
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";
import { Toaster } from "~/components/ui/toaster";
export const metadata: Metadata = {
  title: "Kokoni",
  description: "Personalized deep-research should be easy",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const newsreader = Newsreader({ subsets: ['latin'], variable: '--font-newsreader'})
const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree'})
const inter = Inter({ subsets: ['latin'], variable: '--font-inter'})
const rdh = Red_Hat_Display({ subsets: ['latin'], variable: '--font-rdh'})

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${figtree.variable} ${inter.variable} ${rdh.variable} dark antialiased font-sans`}>
      <body>
        <TRPCReactProvider>
          <SidebarProvider defaultOpen={false} className="bg-card">
            <AppSidebar />
              <SidebarTrigger className="p-4 m-2"/>
              <div className="flex min-h-screen flex-col items-center justify-center bg-card w-full text-foreground">
              {children}
              <Toaster/>
              </div>
          </SidebarProvider>

        </TRPCReactProvider>
      </body>
    </html>
  );
}
