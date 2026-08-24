"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Button } from "@/components/ui/button";

export const ConfirmationDialog = AlertDialogPrimitive.Root;
export const ConfirmationTrigger = AlertDialogPrimitive.Trigger;

export function ConfirmationContent({
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  danger,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  danger?: boolean;
}) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" />
      <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-cream p-6 shadow-soft">
        <AlertDialogPrimitive.Title className="font-display text-2xl">{title}</AlertDialogPrimitive.Title>
        <AlertDialogPrimitive.Description className="mt-2 text-sm text-muted">
          {description}
        </AlertDialogPrimitive.Description>
        <div className="mt-6 flex justify-end gap-2">
          <AlertDialogPrimitive.Cancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogPrimitive.Cancel>
          <AlertDialogPrimitive.Action asChild>
            <Button variant={danger ? "danger" : "default"} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </AlertDialogPrimitive.Action>
        </div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}
