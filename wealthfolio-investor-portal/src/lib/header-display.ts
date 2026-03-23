import { formatDate } from "@/lib/utils";

interface HeaderMessages {
  common: {
    fxRate: string;
    fxUpdatedAt: string;
    quoteUpdatedAt: string;
  };
}

export function buildHeaderMetadata(args: {
  locale: string;
  messages: HeaderMessages;
  sourceCurrency: string;
  baseCurrency: string;
  fxRate: string | null;
  fxUpdatedAt: string | null;
  quoteUpdatedAt: string | null;
}) {
  const items: string[] = [];

  if (args.sourceCurrency !== args.baseCurrency && args.fxRate) {
    items.push(`${args.sourceCurrency} → ${args.baseCurrency} · ${args.messages.common.fxRate} ${args.fxRate}`);
  }

  if (args.fxUpdatedAt) {
    items.push(`${args.messages.common.fxUpdatedAt}：${formatDate(args.fxUpdatedAt, args.locale)}`);
  }

  if (args.quoteUpdatedAt) {
    items.push(`${args.messages.common.quoteUpdatedAt}：${formatDate(args.quoteUpdatedAt, args.locale)}`);
  }

  return items;
}
