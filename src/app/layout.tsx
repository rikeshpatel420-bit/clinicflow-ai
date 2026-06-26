import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClinicFlow AI | Never Miss a Patient Again",
  description: "ClinicFlow AI automatically recovers missed calls, reactivates patients, and turns lost opportunities into booked appointments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#eef4f2] text-[#17211f] antialiased">{children}</body>
    </html>
  );
}
