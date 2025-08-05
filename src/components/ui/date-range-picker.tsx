"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  prevSemesterEndDate?: Date;
}

export function DateRangePicker({ 
  date, 
  setDate, 
  placeholder = "Pick a date",
  disabled = false,
  minDate,
  maxDate,
  className,
  prevSemesterEndDate
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setOpen(false);
  }

  const isDateDisabled = (date: Date) => {
    // Normalize dates to start of day for comparison
    const currentDate = new Date(date);
    currentDate.setHours(0, 0, 0, 0);
    
    // Check minDate constraint
    if (minDate) {
      const normalizedMinDate = new Date(minDate);
      normalizedMinDate.setHours(0, 0, 0, 0);
      
      // Use the actual semester start date as minimum
      if (currentDate < normalizedMinDate) {
        return true;
      }
    }
    
    // Check maxDate constraint
    if (maxDate) {
      const normalizedMaxDate = new Date(maxDate);
      normalizedMaxDate.setHours(23, 59, 59, 999);
      
      if (currentDate > normalizedMaxDate) {
        return true;
      }
    }
    
    return false;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3 py-2",
            !date && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {date ? format(date, "MMM d, yyyy") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={isDateDisabled}
          initialFocus
          className="rounded-md border shadow-md"
        />
      </PopoverContent>
    </Popover>
  )
}
