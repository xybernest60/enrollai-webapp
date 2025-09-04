"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { EnrollmentData } from "./enrollment-wizard";
import { CreditCard } from "lucide-react";

const formSchema = z.object({
  rfid: z.string().min(4, { message: "RFID UID must be at least 4 characters." }),
});

type RfidStepProps = {
  data: EnrollmentData;
  updateData: (data: Partial<EnrollmentData>) => void;
  next: () => void;
  back: () => void;
};

export function RfidStep({ data, updateData, next, back }: RfidStepProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rfid: data.rfid,
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = (values) => {
    updateData(values);
    next();
  };

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-xl font-semibold font-headline">RFID Card Scan</h2>
      <p className="text-muted-foreground mt-1">
        Tap the student's RFID card on the reader.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 w-full max-w-sm space-y-6">
          <FormField
            control={form.control}
            name="rfid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RFID UID</FormLabel>
                <FormControl>
                   <div className="relative">
                     <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Tap card to get UID" {...field} className="pl-10"/>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={back} className="w-full">
              Back
            </Button>
            <Button type="submit" className="w-full">
              Next Step
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
