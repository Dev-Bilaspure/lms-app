'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { ViewMode } from '@/lib/utils/types';

type NavbarProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

export function Navbar({ viewMode, onViewModeChange }: NavbarProps) {
  const pathname = usePathname();
  const isProjectPage = pathname.startsWith('/project/');

  return (
    <nav className={cn(
      "sticky top-0 z-50 h-16",
      "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "border-b border-border"
    )}>
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Left Side: App Title */}
        <Link href="/" className="text-xl font-bold tracking-tight text-foreground hover:text-primary transition-colors">
          LMS APP
        </Link>

        {/* Right Side: Conditional Toggle for Project Pages */}
        <div className="flex items-center gap-4">
          {isProjectPage && (
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => {
                if (value) onViewModeChange(value as ViewMode);
              }}
              aria-label="View Mode"
              className="bg-muted/50 rounded-md p-0.5 border border-border"
              size="sm"
            >
              <ToggleGroupItem
                value="transcript"
                aria-label="Transcript View"
                className={cn(
                  "px-3 py-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground data-[state=off]:hover:bg-accent/80 data-[state=off]:hover:text-accent-foreground rounded-sm",
                  "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none focus-visible:z-10"
                )}
              >
                Transcript
              </ToggleGroupItem>
              <ToggleGroupItem
                value="viral-clips"
                aria-label="Viral Clips View"
                className={cn(
                  "px-3 py-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground data-[state=off]:hover:bg-accent/80 data-[state=off]:hover:text-accent-foreground rounded-sm",
                  "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none focus-visible:z-10"
                )}
              >
                Viral Clips
              </ToggleGroupItem>
            </ToggleGroup>
          )}

          {/* Placeholder for future items like User Profile/Auth */}
        </div>
      </div>
    </nav>
  );
}