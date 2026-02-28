import { SignIn } from '@clerk/nextjs';
import { FloatingEmbers } from '@/components/chat/FloatingEmbers';

export default function SignInPage() {
    return (
        <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden p-6">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0">
                <FloatingEmbers count={30} />
            </div>

            <div className="relative z-10 w-full max-w-md flex flex-col items-center animate-fade-up">
                <div className="mb-8 flex flex-col items-center">
                    <h1
                        className="font-serif text-5xl font-bold mb-2 tracking-tight"
                        style={{
                            background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 50%, #F59E0B 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        omnipotent
                    </h1>
                    <p className="font-mono text-sm text-foreground/50">Total control awaits.</p>
                </div>

                <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
            </div>
        </div>
    );
}
