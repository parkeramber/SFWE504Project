import { useEffect } from "react";

type NotificationProps = {
  kind: "success" | "error" | "info";
  message: string;
  onClose: () => void;
  autoHideMs?: number;
};

export default function Notification({ kind, message, onClose, autoHideMs }: NotificationProps) {
  const className =
    kind === "error"
      ? "toast-alert toast-error"
      : kind === "success"
        ? "toast-alert toast-success"
        : "toast-alert toast-info";

  useEffect(() => {
    if (!autoHideMs) return;
    const timer = setTimeout(onClose, autoHideMs);
    return () => clearTimeout(timer);
  }, [autoHideMs, onClose]);

  return (
    <div className={className}>
      <div style={{ flex: 1, textAlign: "center" }}>{message}</div>
      <button type="button" aria-label="Dismiss" onClick={onClose}>
        ×
      </button>
    </div>
  );
}
