import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in privately. Your relationship data stays yours.">
      <LoginForm googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID)} />
    </AuthShell>
  );
}
