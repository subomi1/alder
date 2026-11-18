import { createFileRoute, Link, Navigate, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { authClient, GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { emailSchema, passwordSchema } from "@/lib/catalog/validate";
import { Button } from "@/components/ui/button";
import { controlClass, Field } from "@/components/ui/field";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (isPending) return <div className="min-h-screen bg-paper" />;
  if (user) return <Navigate to="/dashboard" />;

  return (
    <AuthSplit
      title="Welcome back"
      lede="Sign in to write reviews, manage your profile, and — if you are the first account — open the admin desk."
      footer={
        <p className="text-sm text-muted">
          New here?{" "}
          <Link to="/register" className="font-medium text-ink">
            Create an account
          </Link>
        </p>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          const emailCheck = emailSchema.safeParse(email);
          const passwordCheck = passwordSchema.safeParse(password);
          if (!emailCheck.success) {
            setError(emailCheck.error.issues[0]?.message ?? "Enter a valid email.");
            return;
          }
          if (!passwordCheck.success) {
            setError(passwordCheck.error.issues[0]?.message ?? "Check your password.");
            return;
          }
          setPending(true);
          void authClient.signIn
            .email({ email: emailCheck.data, password })
            .then(async (result) => {
              if (result.error) {
                setError(result.error.message ?? "Could not sign in.");
                setPending(false);
                return;
              }
              await router.invalidate();
              await navigate({ to: "/dashboard" });
            })
            .catch(() => {
              setError("Could not sign in.");
              setPending(false);
            });
        }}
      >
        <Field label="Email">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`${controlClass} h-11`}
            required
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${controlClass} h-11`}
            required
          />
        </Field>
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <ProviderButtons />
    </AuthSplit>
  );
}

export function AuthSplit({
  title,
  lede,
  footer,
  children,
}: {
  title: string;
  lede: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-ink px-10 py-10 text-paper lg:flex">
        <Link to="/" className="font-serif text-3xl">
          Alder
        </Link>
        <blockquote className="max-w-md font-serif text-5xl">Keep what earns its place.</blockquote>
        <p className="max-w-sm text-sm text-paper/70">
          Ratings, reviews, and a moderated shelf. Guests can read. Members can write. Administrators keep the house in order.
        </p>
      </aside>
      <main className="flex flex-col justify-center bg-paper px-6 py-12">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="font-serif text-2xl lg:hidden">
            Alder
          </Link>
          <h1 className="mt-6 font-serif text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-muted">{lede}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6">{footer}</div>
        </div>
      </main>
    </div>
  );
}

export function ProviderButtons() {
  return (
    <div className="mt-6 space-y-2">
      <p className="text-center text-xs tracking-widest text-muted uppercase">Or continue with</p>
      {GROK_PROVIDERS.map((provider) => (
        <button
          key={provider.providerId}
          type="button"
          onClick={() => void signIn(provider.providerId, { callbackURL: "/dashboard" })}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-surface text-sm font-medium text-ink shadow-card hover:bg-paper-deep"
        >
          Continue with {provider.label}
        </button>
      ))}
    </div>
  );
}
