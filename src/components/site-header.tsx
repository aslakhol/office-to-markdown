import Link from "next/link"
import { Button } from "~/components/ui/button"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="font-bold text-xl">
          OfficeToMarkdown
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="default">
            Upgrade
          </Button>
        </div>
      </div>
    </header>
  )
}

