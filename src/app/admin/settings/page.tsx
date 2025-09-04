
"use client"

import AdminLayout from "@/components/admin/admin-layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/logo";


export default function SettingsPage() {
    const { theme, setTheme } = useTheme();

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex justify-center text-center">
            <div className="flex flex-col items-center space-y-2">
                <Logo />
                <div className="pt-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">
                    Settings
                    </h2>
                </div>
            </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                    <Label htmlFor="theme" className="font-medium">Theme</Label>
                    <p className="text-sm text-muted-foreground">Select your preferred color scheme.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme("light")}>
                        Light
                    </Button>
                    <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme("dark")}>
                        Dark
                    </Button>
                     <ThemeToggle />
                </div>
            </div>
             <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                    <Label htmlFor="font" className="font-medium">Font</Label>
                    <p className="text-sm text-muted-foreground">Select the font for the application.</p>
                </div>
                 <Select defaultValue="onest">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="onest">Onest</SelectItem>
                        <SelectItem value="space-grotesk">Space Grotesk</SelectItem>
                        <SelectItem value="inter">Inter</SelectItem>
                        <SelectItem value="roboto">Roboto</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
