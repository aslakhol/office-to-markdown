import { FileText, Zap, MousePointerClick, Globe, Shield, Heart } from 'lucide-react'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 p-3 rounded-full bg-primary/10">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function Features() {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      <FeatureCard
        icon={<MousePointerClick className="h-6 w-6 text-primary" />}
        title="Quick and Easy To Use"
        description="Simply upload your document and get clean, formatted markdown within seconds. No complicated settings or configurations needed."
      />
      <FeatureCard
        icon={<FileText className="h-6 w-6 text-primary" />}
        title="Supports Multiple Formats"
        description="Convert PDF, Word, PowerPoint, Excel, images, audio files, and more. Our tool handles all your document conversion needs."
      />
      <FeatureCard
        icon={<Zap className="h-6 w-6 text-primary" />}
        title="Lightning Fast Conversion"
        description="Our cloud-based conversion engine processes your documents instantly, saving you time and effort."
      />
      <FeatureCard
        icon={<Globe className="h-6 w-6 text-primary" />}
        title="Works Anywhere"
        description="No software to install. Access our converter from any device with a web browser. Convert documents on the go."
      />
      <FeatureCard
        icon={<Shield className="h-6 w-6 text-primary" />}
        title="Your Files Are Safe"
        description="All uploaded files are automatically deleted from our servers within 24 hours. Your privacy is our priority."
      />
      <FeatureCard
        icon={<Heart className="h-6 w-6 text-primary" />}
        title="Free to Use"
        description="Convert your first document for free. Upgrade to process multiple files at once and access advanced features."
      />
    </div>
  )
}

