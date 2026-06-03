import { LoginForm } from "./login-form";

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Sign in</h1>
      <p className="text-sm text-muted-foreground mb-6">Enter your admin credentials to continue.</p>
      <LoginForm nextPath={searchParams.next ?? "/list"} />
    </main>
  );
}
