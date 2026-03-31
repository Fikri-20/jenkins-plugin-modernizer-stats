const styles = {
  healthy: "bg-emerald-100 text-emerald-800",
  "needs-attention": "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-800",
} as const;

const labels = {
  healthy: "Healthy",
  "needs-attention": "Needs Attention",
  critical: "Critical",
} as const;

interface Props {
  status: keyof typeof styles;
  className?: string;
}

export function StatusBadge({ status, className = "" }: Props) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]} ${className}`}
    >
      {labels[status]}
    </span>
  );
}
