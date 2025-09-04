
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { BookOpen, ClipboardCheck, GraduationCap, ScanFace } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

export default function LandingPage() {
  const images = [
    { src: "/images/face1.jpg", alt: "Futuristic facial recognition scan", hint: "facial recognition" },
    { src: "/images/face2.webp", alt: "Student using a tablet for school work", hint: "student tablet" },
    { src: "/images/face3.jpg", alt: "Students in a modern classroom", hint: "students technology" },
    { src: "/images/face4.jpg", alt: "Student holding up an ID card for scanning", hint: "student id" },
    { src: "/images/face5.webp", alt: "Student interacting with a futuristic interface", hint: "student interface" },
    { src: "/images/face6.jpg", alt: "Close-up of an eye during a biometric scan", hint: "biometric scan" },
  ];

  const floatingIcons = [
    { icon: ScanFace, className: "top-1/4 left-10 animate-float-delay-1" },
    { icon: BookOpen, className: "top-1/2 right-12 animate-float-delay-2" },
    { icon: GraduationCap, className: "bottom-1/4 left-20 animate-float-delay-3" },
    { icon: ClipboardCheck, className: "bottom-10 right-1/4 animate-float" },
  ];

  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  return (
    <main className="flex min-h-screen w-full bg-background overflow-hidden">
      <div className="relative flex-1 hidden lg:flex items-center justify-center p-12 bg-primary/5">
        <div className="absolute top-0 left-0 w-72 h-72 bg-accent/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center lg:items-start lg:text-left">
          <Logo />
          <h1 className="mt-8 font-headline text-4xl font-bold tracking-tighter text-foreground sm:text-5xl">
            The Future of Student Management
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            A revolutionary AI-powered system for seamless student enrollment and
            attendance tracking using RFID and advanced Face Recognition.
          </p>
          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="shadow-lg hover:shadow-xl transition-shadow"
            >
              <Link href="/dashboard">Continue to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="relative flex-1 items-center justify-center bg-background p-10 hidden lg:flex">
         {floatingIcons.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className={`absolute text-primary/50 ${item.className}`}>
                <Icon size={48} strokeWidth={1} />
            </div>
          );
        })}
        <div className="relative z-10 w-full max-w-sm">
            <Carousel
                opts={{
                    loop: true,
                    align: "start",
                }}
                plugins={[plugin.current]}
                className="w-full"
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
            >
                <CarouselContent>
                {images.map((image, index) => (
                    <CarouselItem key={index}>
                        <div className="p-1">
                            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl">
                                <Image
                                    src={image.src}
                                    alt={image.alt}
                                    width={800}
                                    height={1200}
                                    className="object-cover"
                                    data-ai-hint={image.hint}
                                />
                            </div>
                        </div>
                    </CarouselItem>
                ))}
                </CarouselContent>
            </Carousel>
        </div>
      </div>
       {/* Mobile View */}
      <div className="flex lg:hidden flex-col items-center justify-center p-6 text-center w-full">
         <Logo />
        <h1 className="mt-8 font-headline text-4xl font-bold tracking-tighter text-foreground sm:text-5xl">
            The Future of Student Management
        </h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">
            A revolutionary AI-powered system for seamless student enrollment and
            attendance tracking using RFID and advanced Face Recognition.
        </p>
        <div className="mt-8">
            <Button
            asChild
            size="lg"
            className="shadow-lg hover:shadow-xl transition-shadow"
            >
            <Link href="/dashboard">Continue to Dashboard</Link>
            </Button>
        </div>
      </div>
    </main>
  );
}
