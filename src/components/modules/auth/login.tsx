"use client";

import InputFieldError from "@/components/shared/InputFieldError";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginUser } from "@/service/auth/loginUser";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

const INPUT =
  "h-12 border-white/10 bg-white/[0.03] text-white placeholder:text-slate-500 transition-colors focus-visible:border-emerald-400/50 focus-visible:ring-2 focus-visible:ring-emerald-400/25";

const LoginForm = ({ redirect }: { redirect?: string }) => {
  const [state, formAction, isPending] = useActionState(loginUser, null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (state && !state.success && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form action={formAction} className="space-y-5">
      {redirect && <input type="hidden" name="redirect" value={redirect} />}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email" className="text-slate-300">
            Email address
          </FieldLabel>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
              required
              className={`${INPUT} pl-10`}
            />
          </div>
          <InputFieldError field="email" state={state} />
        </Field>

        <Field>
          <FieldLabel htmlFor="password" className="text-slate-300">
            Password
          </FieldLabel>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className={`${INPUT} pl-10 pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md text-slate-500 outline-none transition-colors hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-400/50"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          <InputFieldError field="password" state={state} />
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        disabled={isPending}
        className="h-12 w-full bg-gradient-to-r from-emerald-400 to-teal-500 text-base font-semibold text-[#04110d] shadow-lg shadow-emerald-500/20 transition-all hover:brightness-110 hover:shadow-emerald-500/35 active:scale-[0.98] disabled:opacity-70"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </span>
        ) : (
          "Sign in"
        )}
      </Button>

      <FieldDescription className="text-center text-sm text-slate-500">
        Need access? Contact a club admin.
      </FieldDescription>
    </form>
  );
};

export default LoginForm;