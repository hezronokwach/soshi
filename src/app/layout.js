import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Soshi - Social Network",
  description: "A Facebook-like social network",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-white shadow-sm">
          <nav className="container mx-auto p-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">
              Soshi
            </Link>
            <div className="flex gap-4">
              <Link href="/posts" className="hover:text-blue-600">
                Posts
              </Link>
              <Link href="/profile" className="hover:text-blue-600">
                Profile
              </Link>
              <Link href="/groups" className="hover:text-blue-600">
                Groups
              </Link>
              <Link href="/chat" className="hover:text-blue-600">
                Chat
              </Link>
              <Link href="/notifications" className="hover:text-blue-600">
                Notifications
              </Link>
              <Link href="/(auth)/login" className="hover:text-blue-600">
                Login
              </Link>
              <Link href="/(auth)/register" className="hover:text-blue-600">
                Register
              </Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
