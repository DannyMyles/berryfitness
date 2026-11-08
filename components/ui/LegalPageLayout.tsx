import { ReactNode } from 'react';
import { Scale, type LucideIcon } from 'lucide-react';
import PageHero from './PageHero';

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  icon?: LucideIcon;
  children: ReactNode;
}

export default function LegalPageLayout({
  title,
  subtitle,
  lastUpdated,
  icon: Icon = Scale,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="pt-0">
      <PageHero badge="Legal" badgeIcon={Icon} title={title} subtitle={subtitle} />
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-gray-500 mb-8">Last updated: {lastUpdated}</p>
            <div className="legal-content">{children}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
