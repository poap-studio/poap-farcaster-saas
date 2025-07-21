"use client";

import dynamic from "next/dynamic";

const POAPMinter = dynamic(() => import("~/components/POAPMinter"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col p-4">
        <POAPMinter />
    </main>
  );
}
