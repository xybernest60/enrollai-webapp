
"use client";

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

type Class = { id: string; name: string };
type SessionsToolbarProps = {
  classes: Class[];
};

export function SessionsToolbar({ classes }: SessionsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
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

  const hasActiveFilters = searchParams.has('class') || searchParams.has('sort');

  return (
    <Card>
        <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
            <Select
                value={searchParams.get('class') || 'all'}
                onValueChange={(value) => {
                    const newQuery = createQueryString('class', value);
                    router.push(`${pathname}?${newQuery}`);
                }}
            >
                <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            
            <Select
                value={searchParams.get('sort') || 'day_of_week-asc'}
                onValueChange={(value) => {
                    const newQuery = createQueryString('sort', value);
                    router.push(`${pathname}?${newQuery}`);
                }}
            >
                <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="day_of_week-asc">Day of Week</SelectItem>
                    <SelectItem value="name-asc">Name: A-Z</SelectItem>
                    <SelectItem value="name-desc">Name: Z-A</SelectItem>
                    <SelectItem value="created_at-desc">Created: Newest</SelectItem>
                    <SelectItem value="created_at-asc">Created: Oldest</SelectItem>
                </SelectContent>
            </Select>

            {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                    <X className="mr-2 h-4 w-4" />
                    Clear
                </Button>
            )}
            </div>
        </CardContent>
    </Card>
  );
}
