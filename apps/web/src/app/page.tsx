"use client";
import { AuthState, useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const isAuthorized = useAuthStore((state: AuthState) => state.isAuthorized());

  useEffect(() => {
    router.replace(isAuthorized ? "/employees" : "/login");
  });
}
