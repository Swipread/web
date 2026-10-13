import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from './Button'
import styles from './ConfirmDialog.module.css'

type Props = {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** Shows the confirm button as destructive. */
  danger?: boolean
  pending?: boolean
  /** Shown above the buttons, e.g. a server error. */
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Modal confirmation built on <dialog>: focus is trapped and Escape closes it.
 * The cancel button gets the initial focus, so Enter never confirms by accident.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Annuler',
  danger = false,
  pending = false,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // React's autoFocus runs on mount, while the dialog is still closed: focus cancel here.
      dialog.querySelector<HTMLElement>('[data-initial-focus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      // Escape and close() both end here; keep the parent's state in sync.
      onClose={() => open && onCancel()}
      onCancel={(event) => {
        if (pending) event.preventDefault()
      }}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <div id={descriptionId} className={styles.body}>
        {children}
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} disabled={pending} data-initial-focus>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={pending}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
