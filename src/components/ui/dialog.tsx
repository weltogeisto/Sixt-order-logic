import * as RDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Centred modal on desktop, bottom sheet on phones. Radix supplies the focus
 * trap, Escape and scroll lock; this only sets the look.
 */
export function Modal({
  open,
  onOpenChange,
  eyebrow,
  title,
  description,
  children,
  className,
  dismissable = true,
}: {
  open: boolean;
  eyebrow?: ReactNode;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** False keeps the modal up on Escape / outside click (the hour card). */
  dismissable?: boolean;
}) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-40 bg-bg/75 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <RDialog.Content
          onEscapeKeyDown={(e) => (!dismissable ? e.preventDefault() : undefined)}
          onPointerDownOutside={(e) => (!dismissable ? e.preventDefault() : undefined)}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-float)] outline-none",
            "sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-7",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-6 data-[state=open]:duration-300",
            "sm:data-[state=open]:slide-in-from-bottom-2 sm:data-[state=open]:zoom-in-[0.98]",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-150",
            className,
          )}
        >
          {eyebrow ? <div className="mb-3">{eyebrow}</div> : null}
          <RDialog.Title className="font-display text-2xl tracking-tight text-fg">
            {title}
          </RDialog.Title>
          {description ? (
            <RDialog.Description className="mt-2 text-sm leading-relaxed text-muted">
              {description}
            </RDialog.Description>
          ) : (
            <RDialog.Description className="sr-only">{title}</RDialog.Description>
          )}
          {children}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

export const ModalClose = RDialog.Close;
