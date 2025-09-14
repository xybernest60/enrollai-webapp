
"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSessionsForClass, getAttendanceReportData } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { AttendanceReportTable, ReportData } from "./attendance-report-table";
import { AttendanceSummaryCard } from "./attendance-summary-card";

type Class = { id: string; name: string; };
type Session = { id: string; name: string; };

type AttendanceReportProps = {
  classes: Class[];
  initialClassId?: string;
  initialSessionId?: string;
  initialDate?: string;
};

export function AttendanceReport({
  classes,
  initialClassId,
  initialSessionId,
  initialDate,
}: AttendanceReportProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(initialClassId);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isFetchingSessions, setIsFetchingSessions] = useState(false);
  
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(initialSessionId);
  const [date, setDate] = useState<Date | undefined>(initialDate ? parseISO(initialDate) : new Date());

  const [isReportPending, startReportTransition] = useTransition();
  const [reportData, setReportData] = useState<ReportData[]>([]);

  useEffect(() => {
    if (initialClassId) {
      handleClassChange(initialClassId, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (initialClassId && initialSessionId && initialDate) {
      fetchReport(initialSessionId, initialDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClassId, initialSessionId, initialDate]);

  const handleClassChange = async (classId: string, resetSession = true) => {
    setSelectedClassId(classId);
    if (resetSession) {
      setSelectedSessionId(undefined);
      setReportData([]);
    }
    setIsFetchingSessions(true);
    const { data, error } = await getSessionsForClass(classId);
    if (error) {
      console.error(error);
      setSessions([]);
    } else {
      setSessions(data || []);
    }
    setIsFetchingSessions(false);
    updateUrl({ classId, sessionId: resetSession ? undefined : selectedSessionId, date: format(date!, "yyyy-MM-dd") });
  };
  
  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    if (date) {
      updateUrl({ classId: selectedClassId, sessionId, date: format(date, "yyyy-MM-dd") });
      fetchReport(sessionId, format(date, "yyyy-MM-dd"));
    }
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      if (selectedSessionId) {
        updateUrl({ classId: selectedClassId, sessionId: selectedSessionId, date: format(newDate, "yyyy-MM-dd") });
        fetchReport(selectedSessionId, format(newDate, "yyyy-MM-dd"));
      }
    }
  };
  
  const updateUrl = ({ classId, sessionId, date }: { classId?: string, sessionId?: string, date?: string }) => {
    const params = new URLSearchParams(searchParams);
    if (classId) params.set("classId", classId); else params.delete("classId");
    if (sessionId) params.set("sessionId", sessionId); else params.delete("sessionId");
    if (date) params.set("date", date); else params.delete("date");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const fetchReport = (sessionId: string, reportDate: string) => {
    startReportTransition(async () => {
      const { data, error } = await getAttendanceReportData(sessionId, reportDate);
      if (error) {
        console.error(error);
        setReportData([]);
      } else {
        setReportData(data || []);
      }
    });
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Class Selector */}
                    <Select onValueChange={(val) => handleClassChange(val)} value={selectedClassId}>
                        <SelectTrigger>
                            <SelectValue placeholder="1. Select a Class" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    {/* Session Selector */}
                    <Select onValueChange={(val) => handleSessionChange(val)} value={selectedSessionId} disabled={!selectedClassId || isFetchingSessions}>
                        <SelectTrigger>
                            {isFetchingSessions ? <Loader2 className="animate-spin mr-2"/> : null}
                            <SelectValue placeholder="2. Select a Session" />
                        </SelectTrigger>
                        <SelectContent>
                            {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    {/* Date Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                            disabled={!selectedSessionId}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>3. Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateChange}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
            </CardContent>
        </Card>
        
        {isReportPending && (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4">Generating report...</p>
            </div>
        )}

        {!isReportPending && reportData.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <AttendanceSummaryCard reportData={reportData} />
                </div>
                <div className="lg:col-span-2">
                    <AttendanceReportTable reportData={reportData} />
                </div>
            </div>
        )}

        {!isReportPending && selectedSessionId && date && reportData.length === 0 && (
             <Card>
                <CardContent className="p-16 text-center">
                    <h3 className="text-xl font-semibold">No Records Found</h3>
                    <p className="text-muted-foreground mt-2">There is no attendance data for the selected session and date.</p>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
