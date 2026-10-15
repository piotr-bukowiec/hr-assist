"use client";
import { ApiService } from "@/services/api.service";
import { UserProfile, useAuthStore } from "@/store/useAuthStore";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Mail, User } from "lucide-react";
import { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);

  const [emailTouched, setEmailTouched] = useState<boolean>(false);
  const [passwordTouched, setPasswordTouched] = useState<boolean>(false);

  const isEmailValid: boolean = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showEmailError = emailTouched && (email.length === 0 || !isEmailValid);
  const showPasswordError: boolean = passwordTouched && password.length === 0;

  const loginFn = async () => await ApiService.login(email, password);

  const loginMutation = useMutation({
    mutationFn: loginFn,
    onSuccess: (user: UserProfile) => {
      setUser(user);
      router.replace("/employees" as Route);
    },
    onError: ({ message }: Error) => {
      toast.error(message);
    },
  });

  const handleLogin = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password || !isEmailValid) {
      toast.error("Wprowadź dane logowania");
      return;
    }

    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 w-full bg-background">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-2xl shadow-xl shadow-foreground/5 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full border border-border bg-muted flex items-center justify-center mb-4">
              <User size={36} className="text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              HR Assist
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Zaloguj się do swojego konta
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                type="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                aria-invalid={showEmailError}
                className="h-11 pl-10 pr-4"
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Input
                type={isPasswordVisible ? "text" : "password"}
                placeholder="hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                aria-invalid={showPasswordError}
                className="h-11 pl-4 pr-11"
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                // Centrowanie przez inset-y-0 + my-auto (bez transform): bazowe
                // `active:translate-y-px` z Button nadpisywało -translate-y-1/2,
                // przez co przycisk "skakał" w dół przy kliknięciu.
                className="absolute inset-y-0 right-1.5 my-auto text-muted-foreground hover:text-foreground active:not-aria-[haspopup]:translate-y-0"
                aria-label="Pokaż hasło"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                {isPasswordVisible ? <Eye size={16} /> : <EyeOff size={16} />}
              </Button>
            </div>

            <Button
              type="submit"
              disabled={
                !email || !password || !isEmailValid || loginMutation.isPending
              }
              className="mt-2 h-11 w-full text-sm font-semibold shadow-sm shadow-primary/20 active:scale-[0.98]"
            >
              <span>Zaloguj</span>
              {loginMutation.isPending && (
                <Loader2 size={16} className="animate-spin" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
