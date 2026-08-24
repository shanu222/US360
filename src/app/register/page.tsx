import { AuthShell } from "@/components/layout/auth-shell";
import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell title="Begin quietly" subtitle="Create a private space for better remembering, communicating, and care.">
      <RegisterForm googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID)} />
    </AuthShell>
  );
}
