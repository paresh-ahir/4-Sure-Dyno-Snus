"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export type TrashKind =
  | "product"
  | "blog"
  | "faq"
  | "order"
  | "retailer"
  | "lead"
  | "wholesale";

export async function setTrash(kind: TrashKind, id: string, restore = false) {
  const res = await fetch("/api/admin/trash", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, id, restore }),
  });
  if (!res.ok) throw new Error("Could not update trash");
}

export function TrashBinButton({
  open,
  count,
  onToggle,
}: {
  open: boolean;
  count: number;
  onToggle: () => void;
}) {
  return (
    <Button type="button" variant={open ? "primary" : "outline"} onClick={onToggle}>
      <Trash2 size={16} />
      {open ? "Back to list" : `Trash (${count})`}
    </Button>
  );
}

export function TrashAction({
  trashed,
  busy,
  onTrash,
  onRestore,
}: {
  trashed: boolean;
  busy?: boolean;
  onTrash: () => void;
  onRestore: () => void;
}) {
  if (trashed) {
    return (
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onRestore}>
        Restore
      </Button>
    );
  }
  return (
    <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onTrash}>
      <Trash2 size={14} /> Move to trash
    </Button>
  );
}
