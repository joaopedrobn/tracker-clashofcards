import { SearchX } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="col-span-full grid min-h-56 place-items-center rounded-3xl border border-dashed border-white/15 bg-black/15 p-8 text-center">
      <div>
        <SearchX className="mx-auto mb-3 text-stone-500" size={36} />
        <h3 className="font-display text-xl text-stone-200">{title}</h3>
        <p className="mt-1 text-sm text-stone-500">{description}</p>
      </div>
    </div>
  );
}
