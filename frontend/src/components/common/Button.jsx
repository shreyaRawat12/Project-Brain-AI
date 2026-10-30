import { Loader2 } from 'lucide-react';

export default function Button({ children, variant = 'primary', loading = false, ...props }) {
  const cls = `btn btn-${variant}`;
  return (
    <button className={cls} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 size={14} className="spin" />}
      {children}
    </button>
  );
}
