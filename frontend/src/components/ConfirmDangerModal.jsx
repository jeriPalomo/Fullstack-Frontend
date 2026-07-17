import { useEffect, useState } from 'react';
import { Modal } from './Modal';

// Confirmation modal for irreversible actions (delete account, delete customer).
// The confirm button stays disabled until the caller-supplied confirmText is
// typed back exactly, so a misclick on the trigger can't complete the action.
export function ConfirmDangerModal({ open, onClose, title, children, confirmText, confirmLabel = 'Delete', busy, onConfirm }) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  const matched = typed === confirmText;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <button className="danger" disabled={!matched || busy} onClick={onConfirm}>{confirmLabel}</button>
          <button disabled={busy} onClick={onClose}>Cancel</button>
        </>
      }
    >
      {children}
      <p className="muted">This can't be undone. Type <strong>{confirmText}</strong> to confirm.</p>
      <input
        type="text"
        className="confirm-danger-input"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={confirmText}
        autoComplete="off"
        autoFocus
      />
    </Modal>
  );
}
