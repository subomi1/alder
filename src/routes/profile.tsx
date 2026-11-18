import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getMyProfile, updateProfile } from "@/lib/catalog/api";
import { profileInput } from "@/lib/catalog/validate";
import { errorText, formatDate } from "@/lib/format";
import { RequireAccount } from "@/components/require-account";
import { Button } from "@/components/ui/button";
import { controlClass, Field } from "@/components/ui/field";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["me"], queryFn: () => getMyProfile() });
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile.data) return;
    setDisplayName(profile.data.displayName);
    setBio(profile.data.bio);
  }, [profile.data]);

  const save = useMutation({
    mutationFn: () => updateProfile({ data: { displayName, bio } }),
    onSuccess: async () => {
      toast.success("Profile saved");
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => setError(errorText(err)),
  });

  return (
    <RequireAccount>
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <h1 className="font-serif text-4xl">Profile</h1>
        <p className="mt-2 text-sm text-muted">
          Your name appears on new reviews. Older reviews keep the name you used when you wrote them.
        </p>
        {profile.isPending ? <div className="mt-8 h-40 animate-pulse rounded-lg bg-paper-deep" /> : null}
        {profile.data ? (
          <form
            className="mt-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const check = profileInput.safeParse({ displayName, bio });
              if (!check.success) {
                setError(check.error.issues[0]?.message ?? "Check the form.");
                return;
              }
              save.mutate();
            }}
          >
            <Field label="Email">
              <input value={profile.data.email} readOnly className={`${controlClass} h-11 bg-paper-deep`} />
            </Field>
            <Field label="Display name">
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={60}
                className={`${controlClass} h-11`}
              />
            </Field>
            <Field label="Bio" hint={`${bio.trim().length}/280`}>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={280}
                rows={4}
                className={`${controlClass} min-h-28 py-3`}
              />
            </Field>
            <p className="text-sm text-muted">
              {profile.data.role === "admin" ? "Administrator" : "Member"} · joined{" "}
              {formatDate(profile.data.createdAt)}
            </p>
            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save profile"}
            </Button>
          </form>
        ) : null}
      </div>
    </RequireAccount>
  );
}
