import { Suspense } from 'react';

function WizardLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">
        Loading…
      </p>
    </div>
  );
}

export default function WizardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<WizardLoadingFallback />}>
      {children}
    </Suspense>
  );
}