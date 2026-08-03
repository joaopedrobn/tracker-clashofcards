interface ExchangeTextPreviewProps {
  text: string;
}

export function ExchangeTextPreview({ text }: ExchangeTextPreviewProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 h-1 w-12 -translate-y-1/2 rounded-full bg-amber-400" />
      <pre className="exchange-preview custom-scrollbar max-h-[430px] overflow-auto whitespace-pre-wrap rounded-2xl p-4 text-xs leading-relaxed sm:p-5 sm:text-sm">{text}</pre>
    </div>
  );
}
