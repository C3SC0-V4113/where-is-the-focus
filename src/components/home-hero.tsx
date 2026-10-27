import { Cat } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function HomeHero() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-8 text-center text-foreground">
      <Cat className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-semibold tracking-tight">Where Is The Focus</h1>
      <p className="text-sm text-muted-foreground">Edit src/pages/index.astro to start building.</p>
      <Button type="button">Start building</Button>
    </main>
  );
}
