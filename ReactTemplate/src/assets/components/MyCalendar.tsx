import React, { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import {pl} from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  pl: pl,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }), // tydzień od poniedziałku
  getDay,
  locales,
});

const myEvents = [
  {
    title: "Spotkanie",
    start: new Date(2025, 8, 27, 10, 0, 0), // miesiące są 0-indeksowane → wrzesień to 8
    end: new Date(2025, 8, 27, 23, 0, 0),
  },
  {
    title: "Przerwa na kawę",
    start: new Date(2025, 8, 27, 8, 0, 0),
    end: new Date(2025, 8, 27, 12, 30, 0),
    allDay: false,
  },
];

function MyCalendar() {
  const [events, setEvents] = useState(myEvents);
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState<Date | undefined>(undefined);

  return (
    <div className="h-screen p-4">
      <h1 className="text-xl font-bold mb-4">Mój Kalendarz</h1>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="month"
        views={["month", "week", "day"]}
        style={{ height: "80vh" }}
        culture="pl"
        onView={setCurrentView}
        view={currentView}
        date={currentDate}
        onNavigate={date => {
            setCurrentDate(date);
        }}
        selectable
        onSelectSlot={(slotInfo) =>
          console.log("Kliknięto slot: ", slotInfo)
        }
        onSelectEvent={(event) =>
          console.log("Kliknięto wydarzenie: ", event)
        }
      />
    </div>
  );
}

export default MyCalendar;