import LoginForm from '@/modules/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <LoginForm />
    </main>
  );
}
