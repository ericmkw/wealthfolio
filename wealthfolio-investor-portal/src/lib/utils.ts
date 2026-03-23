import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: string | null | undefined, currency = "USD", locale = "en-US") {
  if (!value) {
    return "—";
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return value;
  }

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);

  if (locale === "zh-CN") {
    if (currency === "USD") {
      return formatted.replace("US$", "美元");
    }

    if (currency === "HKD") {
      return formatted.replace("HK$", "港币");
    }
  }

  return formatted;
}

export function formatDateTime(value: string, locale = "en-US") {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(parsed);
}

export function formatDate(value: string, locale = "en-US") {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}
