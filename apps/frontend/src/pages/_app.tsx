import type { AppProps } from "next/app";
import "@/styles/globals.css";
import AppShell from "@/components/layout/AppShell";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>FactoryGPT — ERP Portal</title>
        <meta name="description" content="AI-Powered Factory ERP Portal — Production Monitoring, Vision Inspection, Predictive Maintenance, and Workflow Automation" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AppShell>
        <Component {...pageProps} />
      </AppShell>
    </>
  );
}
