import { UploadConvertPanel } from "@/components/upload-convert-panel";

export default function PrototypePage() {
  return (
    <main className="page-shell">
      <section className="prototype-hero">
        <p className="eyebrow">Phase 1 / Issue #7</p>
        <h1>/prototype</h1>
        <p className="hero-copy">
          Validate the upload to convert to markdown loop before product-shell work. This route stays intentionally
          focused on the MVP formats and the raw conversion output.
        </p>
      </section>
      <UploadConvertPanel />
    </main>
  );
}
