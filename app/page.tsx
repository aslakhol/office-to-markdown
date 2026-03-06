import { UploadConvertPanel } from "@/components/upload-convert-panel";

export default function HomePage() {
  return (
    <main className="page-shell">
      <h1>office-to-markdown</h1>
      <p>UploadThing baseline is wired and returns file references for conversion.</p>
      <UploadConvertPanel />
    </main>
  );
}
