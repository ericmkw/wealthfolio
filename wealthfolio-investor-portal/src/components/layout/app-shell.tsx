import Link from "next/link";
import { HeaderPreferences } from "@/components/layout/header-preferences";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/layout/logout-button";
import type { AuthenticatedUser } from "@/lib/auth/server";
import { getMessages } from "@/lib/i18n";
import type { AppLocale, ResolvedPreferences } from "@/lib/preferences";

export function AppShell({
  user,
  locale,
  preferences,
  title,
  description,
  headerMetadata,
  children,
}: {
  user: AuthenticatedUser;
  locale: AppLocale;
  preferences: ResolvedPreferences;
  title: string;
  description: string;
  headerMetadata?: string[];
  children: React.ReactNode;
}) {
  const messages = getMessages(locale);
  const links =
    user.role === "admin"
      ? [
          { href: "/admin/publish", label: messages.common.publish },
          { href: "/admin/investors", label: messages.common.investors },
          { href: "/activities", label: messages.common.activity },
          { href: "/settings", label: messages.common.settings },
        ]
      : [
          { href: "/overview", label: messages.common.overview },
          { href: "/activities", label: messages.common.activity },
          { href: "/settings", label: messages.common.settings },
        ];

  return (
    <div className="min-h-screen bg-[var(--wf-bg)] text-[var(--wf-fg)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-8">
        <header className="flex flex-col gap-6 border-b border-[var(--wf-border)] pb-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{messages.common.portalName}</h1>
              <Badge variant={user.role}>{user.role}</Badge>
            </div>
            <p className="text-sm text-[var(--wf-muted)]">{user.displayName}</p>
            <nav className="flex flex-wrap gap-3 text-sm text-[var(--wf-muted)]">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-md px-3 py-2 hover:bg-[var(--wf-soft)]">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex flex-col gap-3 md:items-end">
              <HeaderPreferences
                initialPreferences={preferences}
                labels={{
                  locale: messages.settings.locale,
                  theme: messages.settings.theme,
                  baseCurrency: messages.common.baseCurrency,
                  dark: messages.settings.dark,
                  light: messages.settings.light,
                  zhHK: messages.settings.zhHK,
                  en: messages.settings.en,
                  zhCN: messages.settings.zhCN,
                }}
              />
              <LogoutButton label={messages.common.logout} />
            </div>
            {headerMetadata?.length ? (
              <div className="flex flex-col gap-1 text-xs text-[var(--wf-muted)] md:items-end">
                {headerMetadata.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            ) : null}
          </div>
        </header>

        <section className="space-y-2">
          <h2 className="text-3xl font-semibold">{title}</h2>
          <p className="text-sm text-[var(--wf-muted)]">{description}</p>
        </section>

        <main>{children}</main>
      </div>
    </div>
  );
}
