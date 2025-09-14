
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSession, deleteSession } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';


type Class = { id: string; name: string; };
type Session = { 
    id: string; 
    name: string; 
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_recurring: boolean;
    classes: { name: string } | null;
};

type SessionManagerProps = {
  classes?: Class[];
  sessions?: Session[];
  showForm?: boolean;
};

const formSchema = z.object({
  class_id: z.string().uuid("Please select a class."),
  name: z.string().min(1, "Session name is required."),
  day_of_week: z.coerce.number().min(0).max(6),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  is_recurring: z.boolean().default(true),
});

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function SessionManager({ classes = [], sessions = [], showForm = true }: SessionManagerProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      day_of_week: 1,
      start_time: "09:00",
      end_time: "09:15",
      is_recurring: true,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = await createSession(values);
    
    if (result?.error) {
        toast({
            title: "An error occurred.",
            description: result.error,
            variant: "destructive",
        })
    } else {
        toast({
            title: "Success!",
            description: "Session has been created.",
        });
        form.reset();
    }
  };

  const handleDelete = async (sessionId: string) => {
    const result = await deleteSession(sessionId);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: result.message });
    }
  };
  
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return format(date, 'HH:mm');
  }

  return (
    <>
      {showForm && (
        <Card>
          <CardHeader>
              <CardTitle>Create New Session</CardTitle>
              <CardDescription>Define a new check-in period for a class.</CardDescription>
          </CardHeader>
          <CardContent>
          <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                      control={form.control}
                      name="class_id"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Class</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select a class" />
                              </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                              </SelectContent>
                          </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Session Name</FormLabel>
                              <FormControl>
                                  <Input placeholder="e.g. Morning Lecture" {...field} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="day_of_week"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Day of the Week</FormLabel>
                          <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select a day" />
                              </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  {daysOfWeek.map((day, index) => <SelectItem key={index} value={String(index)}>{day}</SelectItem>)}
                              </SelectContent>
                          </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                      <FormField
                          control={form.control}
                          name="start_time"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Start Time</FormLabel>
                                  <FormControl>
                                      <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="end_time"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>End Time</FormLabel>
                                  <FormControl>
                                      <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                  </div>
                  <FormField
                      control={form.control}
                      name="is_recurring"
                      render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                              <FormLabel>Recurring Weekly</FormLabel>
                              <p className="text-sm text-muted-foreground">Does this session repeat every week?</p>
                          </div>
                          <FormControl>
                              <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                              />
                          </FormControl>
                          </FormItem>
                      )}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Session"}
                  </Button>
              </form>
          </Form>
          </CardContent>
        </Card>
      )}

      {!showForm && (
        <Card>
            <CardHeader>
                <CardTitle>Scheduled Sessions</CardTitle>
                <CardDescription>All recurring check-in sessions.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Session</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Day</TableHead>
                                <TableHead>Check-in Window</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessions.length === 0 && <TableRow><TableCell colSpan={6} className="text-center h-24">No sessions found.</TableCell></TableRow>}
                            {sessions.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium">{s.name}</TableCell>
                                    <TableCell>{s.classes?.name ?? 'N/A'}</TableCell>
                                    <TableCell>{daysOfWeek[s.day_of_week]}</TableCell>
                                    <TableCell>{formatTime(s.start_time)} - {formatTime(s.end_time)}</TableCell>
                                    <TableCell>{s.is_recurring ? 'Recurring' : 'One-off'}</TableCell>
                                    <TableCell className="text-right">
                                            <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the session <span className="font-bold">{s.name}</span>. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(s.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      )}
    </>
  );
}
