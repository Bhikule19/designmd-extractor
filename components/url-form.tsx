"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExtractStore } from "@/lib/store";
import type { ExtractionResult } from "@/lib/types";

const schema = z.object({
  url: z
    .string()
    .min(3, "URL is required")
    .max(2048, "URL is too long")
    .refine(
      (v) => /^([a-z0-9-]+\.)+[a-z]{2,}([\/?#].*)?$/i.test(v) || /^https?:\/\//i.test(v),
      { message: "Enter a valid URL (e.g. https://stripe.com)" }
    ),
});

type FormValues = z.infer<typeof schema>;

export function UrlForm() {
  const startExtract = useExtractStore((s) => s.startExtract);
  const setSuccess = useExtractStore((s) => s.setSuccess);
  const setError = useExtractStore((s) => s.setError);
  const setUrlInStore = useExtractStore((s) => s.setUrl);
  const status = useExtractStore((s) => s.status);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { url: "" },
  });

  async function onSubmit(values: FormValues) {
    setUrlInStore(values.url);
    startExtract();
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: values.url }),
      });
      const json = (await res.json()) as ExtractionResult;
      if (!json.ok) {
        setError(json.error);
        return;
      }
      setSuccess(json.tokens);
    } catch (err) {
      setError({
        code: "FETCH_FAILED",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  const isLoading = status === "loading";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-2xl flex flex-col gap-3"
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          {...register("url")}
          placeholder="https://stripe.com"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          disabled={isLoading}
          aria-invalid={!!errors.url}
          aria-describedby={errors.url ? "url-error" : undefined}
        />
        <Button type="submit" size="lg" disabled={isLoading} className="sm:w-44">
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Extracting…
            </>
          ) : (
            <>
              Extract
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
      {errors.url && (
        <p id="url-error" className="text-sm text-red-600">
          {errors.url.message}
        </p>
      )}
      <p className="text-xs text-muted-fg">
        Tokens are extracted from the site&apos;s real CSS — no AI, no screenshots, fully reproducible.
      </p>
    </form>
  );
}
