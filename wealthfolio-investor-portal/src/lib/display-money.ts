import { convertMoneyValue } from "@/lib/fx";

export function resolveDisplayMoney(args: {
  value: string | null | undefined;
  sourceCurrency: string;
  baseCurrency: string;
  rate: string | null;
  mode: "convert" | "preserve-source";
}) {
  if (args.mode === "preserve-source") {
    return {
      value: args.value ?? null,
      currency: args.sourceCurrency,
    };
  }

  return {
    value:
      args.baseCurrency === args.sourceCurrency
        ? args.value ?? null
        : convertMoneyValue(args.value, args.rate),
    currency: args.baseCurrency,
  };
}
