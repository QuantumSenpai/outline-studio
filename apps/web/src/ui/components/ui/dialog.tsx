'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Modal({ open, onOpenChange, title, description, children, trigger }:
  { open: boolean; onOpenChange: (open: boolean) => void; title: string;
    description: string; children: ReactNode; trigger?: ReactNode }) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
    <Dialog.Portal><Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content className="dialog-content">
        <div className="dialog-heading"><Dialog.Title>{title}</Dialog.Title>
          <Dialog.Close className="icon-button" aria-label="Close dialog"><X size={20} /></Dialog.Close></div>
        <Dialog.Description className="muted">{description}</Dialog.Description>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
