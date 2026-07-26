import type { AppProps } from "next/app";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="min-h-screen bg-base px-6 py-8">
      <nav className="flex gap-6 mb-8 font-display text-sm uppercase tracking-wide text-gray-400">
        <a href="/" className="hover:text-cyan">Dashboard</a>
        <a href="/production" className="hover:text-cyan">Production</a>
        <a href="/vision" className="hover:text-cyan">Vision</a>
        <a href="/chat" className="hover:text-cyan">Assistant</a>
      </nav>
      <Component {...pageProps} />
    </div>
  );
}
