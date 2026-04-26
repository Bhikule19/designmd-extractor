"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DownloadButton({
  filename,
  content,
  mimeType = "text/markdown",
  label = "Download",
}: {
  filename: string;
  content: string;
  mimeType?: string;
  label?: string;
}) {
  function download() {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <Button variant="outline" size="sm" onClick={download}>
      <Download className="size-3.5" />
      {label}
    </Button>
  );
}
