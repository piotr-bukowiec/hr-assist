"use client";

import { Search as SearchIcon, Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Route } from "next";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EmployeesSearchProps {
  onAddClick?: () => void;
}

export function Search({ onAddClick }: EmployeesSearchProps) {
  const SEARCH_QUERY_PARAM = "search";
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set(SEARCH_QUERY_PARAM, term);
    } else {
      params.delete(SEARCH_QUERY_PARAM);
    }
    replace(`${pathname}?${params.toString()}` as Route);
  }, 100);

  return (
    <header className="flex max-w-full shrink-0 items-center gap-3 border-b border-border bg-card px-6 py-4">
      <div className="relative flex-1 grow">
        <SearchIcon
          size={15}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="text"
          placeholder="Szukaj pracowników..."
          onChange={(event) => handleSearch(event.target.value)}
          defaultValue={searchParams.get(SEARCH_QUERY_PARAM)?.toString() ?? ""}
          className="h-9 pr-4 pl-9"
        />
      </div>
      <Button
        type="button"
        size="icon"
        onClick={onAddClick}
        className="h-9 w-9 shadow-sm active:scale-95"
        aria-label="Dodaj pracownika"
      >
        <Plus size={18} />
      </Button>
    </header>
  );
}
