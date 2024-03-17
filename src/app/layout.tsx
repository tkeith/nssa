import "@/styles/globals.css";

import { Inter } from "next/font/google";
import { cookies } from "next/headers";

import APP_DESCRIPTION from "@/app/_lib/APP_DESCRIPTION";
import APP_TITLE from "@/app/_lib/APP_TITLE";
import { TRPCReactProvider } from "@/trpc/react";
import { Providers } from "@/app/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable}`}>
        <TRPCReactProvider cookies={cookies().toString()}>
          <Providers>{children}</Providers>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
