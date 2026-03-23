"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMessages } from "@/lib/i18n";
import type { AppLocale } from "@/lib/preferences";

export function LoginForm({ locale }: { locale: AppLocale }) {
  const router = useRouter();
  const messages = getMessages(locale);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, password }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(body?.message ?? "Login failed.");
      setIsLoading(false);
      return;
    }

    const body = (await response.json()) as { user: { role: "admin" | "investor" } };
    router.push(body.user.role === "admin" ? "/admin/publish" : "/overview");
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md">
        <CardHeader>
        <CardTitle>{messages.login.title}</CardTitle>
        <CardDescription>{messages.login.description}</CardDescription>
        </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="identifier">{messages.login.username}</Label>
            <Input
              id="identifier"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{messages.login.password}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? `${messages.login.submit}...` : messages.login.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
