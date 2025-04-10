'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

type ViewMode = 'transcript' | 'viralClips';

interface NavbarProps {
  // Potentially receive viewMode and setViewMode from page component if needed
  // currentView?: ViewMode;
  // onViewChange?: (view: ViewMode) => void;
}

export function Navbar({ /* currentView, onViewChange */ }: NavbarProps) {
  const pathname = usePathname();
  const isProjectPage = pathname.startsWith('/project/');

  // Placeholder state - In a real app, this state might live in the page
  // component and be passed down, or use a global state manager / context.
  const currentView: ViewMode = 'transcript';
  const onViewChange = (view: ViewMode) => {
    console.log("View change requested to:", view);
    // Here you would call the actual state setter passed via props
    // onViewChange?.(view);
  };


  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 h-16",
      "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", // Glassmorphism effect
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
              defaultValue="transcript"
              value={currentView} // Controlled by state
              onValueChange={(value) => {
                if (value) onViewChange(value as ViewMode); // Update state on change
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
                 value="viralClips"
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

          {/* Placeholder for potential future items like User Profile/Auth */}
           {/* <UserNav /> */}
        </div>
      </div>
    </nav>
  );
}