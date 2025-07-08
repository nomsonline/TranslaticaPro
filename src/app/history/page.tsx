import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History as HistoryIcon } from 'lucide-react';

export default function History() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Translation History
        </h1>
        <p className="text-muted-foreground">
          Review your past document translations.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <HistoryIcon className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">No History Yet</h3>
            <p className="text-muted-foreground">
              Your translated documents will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
