"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { EnrollmentData } from "./enrollment-wizard";
import { User } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

type NameStepProps = {
  data: EnrollmentData;
  updateData: (data: Partial<EnrollmentData>) => void;
  next: () => void;
};

export function NameStep({ data, updateData, next }: NameStepProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data.name,
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = (values) => {
    updateData(values);
    next();
  };

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-xl font-semibold font-headline">Student's Information</h2>
      <p className="text-muted-foreground mt-1">
        Please enter the student's full name.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 w-full max-w-sm space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <div className="relative">
                     <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="e.g. John Doe" {...field} className="pl-10"/>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            Next Step
          </Button>
        </form>
      </Form>
    </div>
  );
}
