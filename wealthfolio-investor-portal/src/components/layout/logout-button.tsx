"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton({ label }: { label: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    router.push("/login");
    router.refresh();
  };

  return (
    <Button variant="ghost" onClick={handleLogout}>
      {label}
    </Button>
  );
}
