import "~/styles/globals.css";

import { Newsreader, Figtree }  from "next/font/google"
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
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${figtree.variable} dark antialiased font-sans`}>
      <body>
        <TRPCReactProvider>
          <SidebarProvider defaultOpen>
            <AppSidebar />
              <SidebarTrigger className="p-4 m-2"/>
              <div className="flex min-h-screen flex-col items-center justify-center bg-background w-full text-foreground p-4">
              {children}
              <Toaster/>
              </div>
          </SidebarProvider>

        </TRPCReactProvider>
      </body>
    </html>
  );
}
