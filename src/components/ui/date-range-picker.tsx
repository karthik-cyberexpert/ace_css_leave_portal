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
    const july1 = new Date(date.getFullYear(), 6, 1); // July 1 of the year
    const july29 = new Date(date.getFullYear(), 6, 29); // July 29 of the year

    // For semester 3, special handling
    if (minDate && minDate.getMonth() === 6 && minDate.getDate() === 1) { // July 1 minDate indicates semester 3
      // If there's a previous semester end date and it's July 29, disable dates on or before July 29
      if (prevSemesterEndDate && 
          prevSemesterEndDate.getMonth() === 6 && 
          prevSemesterEndDate.getDate() === 29) {
        if (date <= july29) {
          return true;
        }
      }
      // Otherwise, allow selection from July 1 onward
      if (date < july1) {
        return true;
      }
    } else {
      // Standard minDate check for other semesters
      if (minDate && date < minDate) {
        return true;
      }
    }

    if (maxDate && date > maxDate) return true;
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
