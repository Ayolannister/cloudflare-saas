import { useToasts } from '../stores/ui';
import { Icon } from './Icon';

export function Toasts() {
  const toasts = useToasts((state) => state.toasts);
  const dismiss = useToasts((state) => state.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-start gap-2 sm:inset-x-6 sm:bottom-6">
      {toasts.map((item) => (
        <div
          key={item.id}
          role={item.tone === 'error' ? 'alert' : 'status'}
          className={`toast pointer-events-auto flex max-w-md items-start gap-3 rounded-lg px-4 py-3 text-sm ${
            item.tone === 'error' ? 'bg-danger text-white' : 'bg-ink text-surface'
          }`}
        >
          <p className="flex-1 leading-snug">{item.text}</p>
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            className="-mr-1 mt-px rounded p-0.5 opacity-80 hover:opacity-100"
            aria-label="Dismiss message"
          >
            <Icon name="close" width={14} height={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
