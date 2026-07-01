import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "AI Email Assistant",
  description: "Read, prioritize, and act on your Gmail with AI.",
};

const themeScript = `
try {
  var t = localStorage.getItem('theme');
  if (t === 'light') { document.documentElement.classList.remove('dark'); }
  else { document.documentElement.classList.add('dark'); }
} catch (e) { document.documentElement.classList.add('dark'); }
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}