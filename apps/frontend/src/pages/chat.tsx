/** FactoryGPT — AI Factory Assistant Chat Page */
import Head from "next/head";
import ChatWidget from "@/components/chatbot/ChatWidget";

export default function ChatPage() {
  return (
    <>
      <Head>
        <title>Assistant — FactoryGPT ERP Portal</title>
      </Head>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-[var(--color-text-primary)]">
            Factory Assistant
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            AI-powered chatbot for factory queries, reports, and automation
          </p>
        </div>
        <ChatWidget />
      </div>
    </>
  );
}
