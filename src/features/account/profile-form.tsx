"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/features/account/actions";
import {
  confirmUpload,
  createUploadUrl,
} from "@/features/files/actions";

interface ProfileFormProps {
  name: string;
  email: string;
  image: string | null;
  storageConfigured: boolean;
}

export const ProfileForm = ({
  name,
  email,
  image,
  storageConfigured,
}: ProfileFormProps) => {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(name);
  const [imageUrl, setImageUrl] = useState(image);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsUploading(true);

    try {
      const urlResult = await createUploadUrl({
        contentType: selected.type,
        sizeBytes: selected.size,
        prefix: "avatars",
      });
      if (urlResult.error || !urlResult.uploadUrl || !urlResult.key) {
        setError(urlResult.error ?? "Could not start upload");
        return;
      }

      const put = await fetch(urlResult.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": selected.type },
        body: selected,
      });
      if (!put.ok) {
        setError("Upload to storage failed");
        return;
      }

      const confirmed = await confirmUpload({
        key: urlResult.key,
        contentType: selected.type,
        sizeBytes: selected.size,
      });
      if (confirmed.error || !confirmed.url) {
        setError(confirmed.error ?? "Could not save file");
        return;
      }

      setImageUrl(confirmed.url);
      setMessage("Avatar uploaded. Click Save profile to apply.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload failed",
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await updateProfile({
        name: displayName,
        image: imageUrl || null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Profile updated.");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-white p-5"
    >
      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}

      <div className="flex items-center gap-4">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="h-16 w-16 rounded-full border border-border object-cover"
          />
        ) : (
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted font-mono text-xs text-muted-foreground"
            aria-hidden
          >
            —
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="avatar">Avatar</Label>
          {storageConfigured ? (
            <Input
              id="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              disabled={isUploading || isPending}
              aria-label="Upload avatar"
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Set S3_* env vars to enable avatar uploads.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Display name</Label>
        <Input
          id="name"
          name="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          required
          maxLength={100}
          aria-label="Display name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          disabled
          aria-label="Email address"
        />
        <p className="text-xs text-muted-foreground">
          Email changes are not supported in this template.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isPending || isUploading || !displayName.trim()}
      >
        {isPending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
};
