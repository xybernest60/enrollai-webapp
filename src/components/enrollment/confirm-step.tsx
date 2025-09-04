
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EnrollmentData } from "./enrollment-wizard";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type ConfirmStepProps = {
  data: EnrollmentData;
  back: () => void;
  goToStep: (step: number) => void;
};

export function ConfirmStep({ data, back, goToStep }: ConfirmStepProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let imageUrl: string | null = null;
    const sanitizedRfid = data.rfid.trim();

    try {
        if (data.profilePicture) {
            const fileExtension = data.profilePicture.name.split('.').pop();
            const filePath = `${sanitizedRfid}.${fileExtension}`;
            
            const { error: uploadError } = await supabase.storage
            .from('student-photos')
            .upload(filePath, data.profilePicture, {
                upsert: true,
            });

            if (uploadError) {
                console.error("Supabase Storage Upload Error:", uploadError);
                throw new Error(`Failed to upload profile picture. Reason: ${uploadError.message}`);
            }

            const { data: urlData } = supabase.storage
            .from('student-photos')
            .getPublicUrl(filePath);
            
            imageUrl = urlData.publicUrl;
        }

        const { error: insertError } = await supabase
            .from('students')
            .insert({
                name: data.name,
                rfid_uid: sanitizedRfid,
                face_embedding: data.faceEmbeddings,
                image_url: imageUrl,
            });

        if (insertError) {
             console.error("Supabase Insert Error:", insertError);
            if (insertError.code === '23505') {
                throw new Error("This RFID UID is already registered to another student.");
            }
            throw new Error(`Failed to save student data. Reason: ${insertError.message}`);
        }

      toast({
        title: "Enrollment Successful",
        description: `${data.name} has been successfully enrolled.`,
        variant: 'default',
      });
      router.push("/admin/students");
    } catch (error) {
       let errorMessage = "Something went wrong. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Enrollment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-xl font-semibold font-headline">Confirm Details</h2>
      <p className="text-muted-foreground mt-1">
        Please review the student's information before submitting.
      </p>
      <Card className="mt-6 w-full max-w-lg text-left">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Profile Picture</span>
            {data.profilePicture && (
              <Image
                src={URL.createObjectURL(data.profilePicture)}
                alt="Profile preview"
                width={64}
                height={64}
                className="rounded-full object-cover"
              />
            )}
            <Button variant="link" size="sm" onClick={() => goToStep(4)}>Edit</Button>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Full Name</span>
            <span className="font-medium">{data.name}</span>
            <Button variant="link" size="sm" onClick={() => goToStep(1)}>Edit</Button>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">RFID UID</span>
            <span className="font-mono text-sm p-1 bg-muted rounded">{data.rfid}</span>
            <Button variant="link" size="sm" onClick={() => goToStep(2)}>Edit</Button>
          </div>
           <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Face Scan</span>
            <span className="font-medium text-green-600">
              {data.faceEmbeddings ? "Completed" : "Not Completed"}
            </span>
             <Button variant="link" size="sm" onClick={() => goToStep(3)}>Edit</Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex w-full max-w-sm gap-4">
        <Button type="button" variant="outline" onClick={back} className="w-full" disabled={isSubmitting}>
          Back
        </Button>
        <Button type="button" onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm & Enroll
        </Button>
      </div>
    </div>
  );
}
