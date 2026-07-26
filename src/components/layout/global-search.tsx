"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, User, CheckSquare, Package } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useGlobalSearch } from "@/features/search/queries";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const { data: results, isLoading } = useGlobalSearch(query);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (link: string) => {
    setOpen(false);
    router.push(link);
  };

  const workers = results?.filter((r) => r.type === "worker") || [];
  const tasks = results?.filter((r) => r.type === "task") || [];
  const inventory = results?.filter((r) => r.type === "inventory") || [];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border rounded-md hover:bg-muted/50 transition-colors bg-background w-full md:w-64"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search workers, tasks, inventory..." 
          value={query} 
          onValueChange={setQuery} 
        />
        <CommandList>
          {query.length < 2 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search...
            </div>
          )}
          {isLoading && query.length >= 2 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}
          {!isLoading && query.length >= 2 && results?.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {workers.length > 0 && (
            <CommandGroup heading="Workers">
              {workers.map((worker) => (
                <CommandItem key={worker.id} onSelect={() => handleSelect(worker.link)}>
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{worker.title}</span>
                    <span className="text-xs text-muted-foreground">{worker.subtitle}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {tasks.length > 0 && (
            <CommandGroup heading="Work Tasks">
              {tasks.map((task) => (
                <CommandItem key={task.id} onSelect={() => handleSelect(task.link)}>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{task.title}</span>
                    <span className="text-xs text-muted-foreground">{task.subtitle}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {inventory.length > 0 && (
            <CommandGroup heading="Inventory">
              {inventory.map((item) => (
                <CommandItem key={item.id} onSelect={() => handleSelect(item.link)}>
                  <Package className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
