import { en } from "@/lib/messages/en";
import { zhCN } from "@/lib/messages/zh-CN";
import { zhHK } from "@/lib/messages/zh-HK";
import type { AppLocale } from "@/lib/preferences";

export function getMessages(locale: AppLocale) {
  switch (locale) {
    case "en":
      return en;
    case "zh-CN":
      return zhCN;
    case "zh-HK":
    default:
      return zhHK;
  }
}
