"use client";

import { UploadForm } from "~/components/upload-form";
import { SiteHeader } from "~/components/site-header";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <UploadForm />
    </div>
  );
}
