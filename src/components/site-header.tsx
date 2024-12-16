import Link from "next/link";
import { Button } from "~/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          OfficeToMarkdown
        </Link>
        <Button variant="default">Upgrade</Button>
      </div>
    </header>
  );
}
