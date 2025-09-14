
"use client";

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { Button } from '../ui/button';

type Class = { id: string; name: string };
type StudentsToolbarProps = {
  classes: Class[];
};

export function StudentsToolbar({ classes }: StudentsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );
  
  const clearFilters = () => {
    router.push(pathname);
  }

  const hasActiveFilters = searchParams.has('q') || searchParams.has('class') || searchParams.has('sort');

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by name..."
          className="pl-10"
          defaultValue={searchParams.get('q') || ''}
          onChange={(e) => {
            const newQuery = createQueryString('q', e.target.value);
            router.push(`${pathname}?${newQuery}`);
          }}
        />
      </div>

      <Select
        value={searchParams.get('class') || ''}
        onValueChange={(value) => {
            const newQuery = createQueryString('class', value);
            router.push(`${pathname}?${newQuery}`);
        }}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by class" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="">All Classes</SelectItem>
            {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
        </SelectContent>
      </Select>
      
      <Select
        value={searchParams.get('sort') || 'created_at-desc'}
        onValueChange={(value) => {
            const newQuery = createQueryString('sort', value);
            router.push(`${pathname}?${newQuery}`);
        }}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="created_at-desc">Enrolled: Newest</SelectItem>
            <SelectItem value="created_at-asc">Enrolled: Oldest</SelectItem>
            <SelectItem value="name-asc">Name: A-Z</SelectItem>
            <SelectItem value="name-desc">Name: Z-A</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
            <X className="mr-2 h-4 w-4" />
            Clear
        </Button>
      )}
    </div>
  );
}
