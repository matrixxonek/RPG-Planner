import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { Calendar, dateFnsLocalizer, type View, type CalendarProps } from "react-big-calendar";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import "react-big-calendar/lib/addons/dragAndDrop/styles.css"; 
import React, { useState, useEffect } from "react";
import { format, parse, startOfWeek, getDay } from "date-fns";
import {pl} from "date-fns/locale"; 
import "react-big-calendar/lib/css/react-big-calendar.css";
import axios from "axios";
import { useCalendarEvents } from '../hooks/useCalendarTasks.ts'
import type { CalendarEvent, EventApi} from "../types/taskTypes.ts";
import FormDisplay from './FormDisplay.tsx';

interface DndProps<TEvent extends object> extends CalendarProps<TEvent> {
    draggable: boolean;
    resizable: boolean;
    onEventDrop: (args: any) => void; // Używamy any, aby uniknąć problemów z typowaniem D&D
    onEventResize: (args: any) => void;
}

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

const DndCalendar = withDragAndDrop(Calendar) as React.ComponentType<DndProps<CalendarEvent>>;

function MyCalendar() {
  const { events, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState<Date | undefined>(undefined);
  const [formVisible, setFormVisible] = useState(false);

  const handleAdd = (slotInfo: {start: Date, end: Date, slots: Date[] }) =>{
    const title = window.prompt('Wpisz nazwę nowego zadania: ');
    if(!title)
      return

    const newTask = {
      title,
      start: slotInfo.start,
      end: slotInfo.end,
      allDay: false,
    };
    addEvent(newTask as Omit<CalendarEvent, 'id'>);
  };

  const handleModify = (args: any) => { 
    // Argumenty z onEventDrop/onEventResize mogą mieć różne kształty, ale kluczowe są te pola
    const { event, start, end, isAllDay, droppedOnAllDaySlot } = args;

    // 1. Konwersja dat na obiekty Date (najbezpieczniejsza, bo hook API oczekuje Date)
    const newStart = typeof start === 'string' ? new Date(start) : start;
    const newEnd = typeof end === 'string' ? new Date(end) : end;
    
    // 2. Logika zarządzania flagą allDay przy przeciąganiu (z klasycznego przykładu D&D)
    let finalAllDay = event.allDay;
    if (droppedOnAllDaySlot !== undefined) { 
        if (!event.allDay && droppedOnAllDaySlot) {
            finalAllDay = true;
        } else if (event.allDay && !droppedOnAllDaySlot) {
            finalAllDay = false;
        }
    } else {
        // Użyj isAllDay przekazanego przez resize, jeśli istnieje
        finalAllDay = isAllDay ?? event.allDay;
    }

    const updatedEvent: CalendarEvent = {
        ...event,
        start: newStart, // Używamy skonwertowanych dat
        end: newEnd,
        allDay: finalAllDay
    };
    
    updateEvent(updatedEvent);
  };

  const handleDelete = (event: CalendarEvent) => {
    if (window.confirm(`Czy na pewno chcesz usunąć zadanie: ${event.title}?`)) {
            deleteEvent(event.id);
        }
  }

  const handleFormOpen = () => { //musi przyjmować dane o klikniętym/przesuniętym miejscu/evencie {prawdopodobnie trzeba będzie przeładować funkcję 
  // możliwościami}
    setFormVisible(true);
  }

  const handleFormClose = () => {
    setFormVisible(false);
  }

  const handleFormSave = () => {
    //logika modyfikacji taska - wywoływanie funkcji handle Task/Event Add
    setFormVisible(false);
  }

  return (
    <div>
      <DndProvider backend={HTML5Backend}>
        <div className="h-screen p-4">
          <h1 className="text-xl font-bold mb-4">Mój Kalendarz</h1>
          <DndCalendar
            localizer={localizer}
            events={events}
            startAccessor={(event: CalendarEvent) => event.start} 
            endAccessor={(event: CalendarEvent) => event.end}   
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
            draggable
            resizable
            onSelectSlot={handleFormOpen}
            onEventDrop={handleFormOpen}
            onEventResize={handleFormOpen}
            onSelectEvent={handleFormOpen}
          />
        </div>
      </DndProvider>
      {formVisible && (<FormDisplay onClose = {handleFormClose} onSubmit={handleFormClose}/>)}
    </div>
  );
}

export default MyCalendar;