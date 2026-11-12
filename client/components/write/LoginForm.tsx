"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/write/actions";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="password" className="sr-only">
        암호
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? "login-error" : undefined}
        className="bg-background focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive h-10 rounded-md border px-3 text-sm outline-none focus-visible:ring-3"
        placeholder="암호"
      />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "확인 중…" : "들어가기"}
      </Button>
      {state.error && (
        <p id="login-error" role="alert" className="text-destructive m-0 text-sm">
          {state.error}
        </p>
      )}
    </form>
  );
}
