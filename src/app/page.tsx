import { TranslationCard } from '@/components/translation-card';

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Upload & Translate
        </h1>
        <p className="text-muted-foreground">
          Translate your documents with AI-powered precision.
        </p>
      </div>
      <TranslationCard />
    </div>
  );
}
