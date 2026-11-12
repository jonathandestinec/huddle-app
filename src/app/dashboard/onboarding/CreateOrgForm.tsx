"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button, Field, Input } from "@/components/ui";
import { checkSlugAction, createOrganisationAction } from "@/lib/orgs/actions";
import { slugify } from "@/lib/slug";
import { uploadFile } from "@/lib/storage/upload-client";

export function CreateOrgForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  useEffect(() => {
    if (slug.length < 2) return setAvailable(null);
    const t = setTimeout(() => checkSlugAction(slug).then(setAvailable), 300);
    return () => clearTimeout(t);
  }, [slug]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    start(async () => {
      try {
        const logoKey = logo ? await uploadFile(logo, "logos") : undefined;
        const res = await createOrganisationAction({ name, slug, logoKey });
        if (!res.ok) return setError(res.error);
        router.push("/dashboard/onboarding/bank");
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <Field label="Organisation name">
        <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="The Watchers Channel" />
      </Field>
      <Field
        label="Your Huddle link"
        hint={available === false ? undefined : `huddle…/${slug || "your-name"}`}
        error={available === false ? "That link is taken" : undefined}
      >
        <Input
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
        />
      </Field>
      <Field label="Logo (optional)" hint="PNG or JPG">
        <Input type="file" accept="image/png,image/jpeg" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending || available === false} className="w-full">
        {pending ? "Creating…" : "Create organisation"}
      </Button>
    </form>
  );
}
