import { createFileRoute, Link, Navigate, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyProfile } from "@/lib/catalog/api";
import { emailSchema, passwordSchema, profileInput } from "@/lib/catalog/validate";
import { Button } from "@/components/ui/button";
import { controlClass, Field } from "@/components/ui/field";
import { AuthSplit, ProviderButtons } from "./login";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (isPending) return <div className="min-h-screen bg-paper" />;
  if (user) return <Navigate to="/dashboard" />;

  return (
    <AuthSplit
      title="Create an account"
      lede="The first account on Alder becomes the administrator. Passwords are hashed and never stored in plain text."
      footer={
        <p className="text-sm text-muted">
          Already registered?{" "}
          <Link to="/login" className="font-medium text-ink">
            Sign in
          </Link>
        </p>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          const nameCheck = profileInput.shape.displayName.safeParse(name);
          const emailCheck = emailSchema.safeParse(email);
          const passwordCheck = passwordSchema.safeParse(password);
          if (!nameCheck.success) {
            setError(nameCheck.error.issues[0]?.message ?? "Check your name.");
            return;
          }
          if (!emailCheck.success) {
            setError(emailCheck.error.issues[0]?.message ?? "Enter a valid email.");
            return;
          }
          if (!passwordCheck.success) {
            setError(passwordCheck.error.issues[0]?.message ?? "Check your password.");
            return;
          }
          if (password !== confirm) {
            setError("Passwords do not match.");
            return;
          }
          setPending(true);
          void authClient.signUp
            .email({ email: emailCheck.data, password, name: nameCheck.data })
            .then(async (result) => {
              if (result.error) {
                setError(result.error.message ?? "Could not create the account.");
                setPending(false);
                return;
              }
              await getMyProfile();
              await router.invalidate();
              await navigate({ to: "/dashboard" });
            })
            .catch(() => {
              setError("Could not create the account.");
              setPending(false);
            });
        }}
      >
        <Field label="Name">
          <input
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={`${controlClass} h-11`}
            required
          />
        </Field>
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
        <Field label="Password" hint="At least 8 characters, with a letter and a number.">
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${controlClass} h-11`}
            required
          />
        </Field>
        <Field label="Confirm password">
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
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
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <ProviderButtons />
    </AuthSplit>
  );
}
