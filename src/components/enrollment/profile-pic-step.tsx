"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EnrollmentData } from "./enrollment-wizard";
import Image from "next/image";
import { Upload, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ProfilePicStepProps = {
  data: EnrollmentData;
  updateData: (data: Partial<EnrollmentData>) => void;
  next: () => void;
  back: () => void;
};

export function ProfilePicStep({ data, updateData, next, back }: ProfilePicStepProps) {
  const [preview, setPreview] = useState<string | null>(
    data.profilePicture ? URL.createObjectURL(data.profilePicture) : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 2MB.",
          variant: "destructive",
        });
        return;
      }
      updateData({ profilePicture: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    if (!data.profilePicture) {
        toast({
          title: "No image selected",
          description: "Please upload a profile picture to continue.",
          variant: "destructive",
        });
        return;
    }
    next();
  }

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-xl font-semibold font-headline">Profile Picture</h2>
      <p className="text-muted-foreground mt-1">
        Upload a clear photo of the student.
      </p>
      <div className="mt-6 w-full max-w-sm">
        <div
          className="relative w-48 h-48 mx-auto border-2 border-dashed rounded-full flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
          onClick={handleButtonClick}
        >
          {preview ? (
            <Image
              src={preview}
              alt="Profile preview"
              width={192}
              height={192}
              className="rounded-full object-cover w-full h-full"
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto" />
              <p className="mt-2 text-sm">Click to upload</p>
            </div>
          )}
          <Input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png, image/jpeg"
            onChange={handleFileChange}
          />
        </div>
        <Button variant="outline" onClick={handleButtonClick} className="mt-4 w-full">
            <Upload className="mr-2 h-4 w-4" />
            Choose a photo
        </Button>
      </div>

      <div className="mt-8 flex w-full max-w-sm gap-4">
        <Button type="button" variant="outline" onClick={back} className="w-full">
          Back
        </Button>
        <Button type="button" onClick={handleSubmit} className="w-full">
          Next Step
        </Button>
      </div>
    </div>
  );
}
