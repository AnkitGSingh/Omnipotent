import type { Metadata } from 'next';
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { ClerkProvider } from '@clerk/nextjs';
import { FloatingEmbers } from '@/components/chat/FloatingEmbers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Omnipotent | Multi-Model AI',
  description: 'One platform. All models. Total control.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground selection:bg-amber/20 selection:text-foreground`}
      >
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: 'hsl(var(--amber))',
              colorText: 'hsl(var(--foreground))',
              colorBackground: 'hsl(var(--sidebar-bg))',
              colorInputBackground: 'transparent',
              colorInputText: 'hsl(var(--foreground))',
              colorDanger: 'hsl(var(--destructive))',
              borderRadius: '0.75rem',
            },
            elements: {
              card: 'border border-amber/15 bg-background/60 backdrop-blur-xl shadow-2xl',
              headerTitle: 'font-serif text-amber text-2xl',
              headerSubtitle: 'font-mono text-xs text-foreground/50',
              socialButtonsBlockButton: 'border-amber/20 bg-foreground/5 hover:bg-amber/10 hover:border-amber/40 transition-all font-mono text-sm text-foreground/80',
              socialButtonsBlockButtonText: 'font-mono text-sm font-medium',
              dividerLine: 'bg-amber/20',
              dividerText: 'font-mono text-xs text-foreground/40',
              formFieldLabel: 'font-mono text-xs text-foreground/70',
              formFieldInput: 'font-mono text-sm border-amber/20 focus:border-amber/60 focus:ring-amber/20 transition-all bg-transparent',
              formButtonPrimary: 'font-mono font-semibold bg-amber hover:bg-amber-hover text-background transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]',
              footerActionText: 'font-mono text-xs text-foreground/50',
              footerActionLink: 'font-mono text-xs text-amber hover:text-amber-hover',
              identityPreview: 'border-amber/20 bg-foreground/5',
              identityPreviewText: 'font-mono text-sm',
              identityPreviewEditButtonIcon: 'text-amber',
              userPreviewMainIdentifier: 'text-foreground font-semibold text-sm',
              userPreviewSecondaryIdentifier: 'text-foreground/70',
              userButtonPopoverActionButtonText: 'text-foreground text-sm',
              userButtonPopoverActionButtonIconBox: 'text-foreground/70',
            }
          }}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            storageKey="omnipotent-theme"
          >
            {/* Global ambient embers — visible on every page */}
            <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
              <FloatingEmbers count={14} />
            </div>
            <div className="relative z-10">
              {children}
            </div>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html >
  );
}
