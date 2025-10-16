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
import { useEvents } from '../hooks/useCalendarTasks.ts'
import type { Event, Task, ItemToEdit, EditableItem, ItemDraft, } from '../types/taskTypes'; 
import { isModification } from "../types/taskTypes";
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

const DndCalendar = withDragAndDrop(Calendar) as React.ComponentType<DndProps<Event>>;

function MyCalendar() {
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState<Date | undefined>(undefined);
  const [formVisible, setFormVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ItemToEdit>(null); 

  const handleFormClose = () => setItemToEdit(null); 

  const handleUnifiedSubmit = (item: ItemToEdit) => {
    if (!item) return; // Zabezpieczenie przed nullem!

    // 1. ZAMKNIJ MODAL natychmiast, aby dać UX feedback
    handleFormClose(); 

    // 2. SPRAWDZENIE: Czy to Edycja czy Tworzenie? (Używamy teraz Type Guard z TaskTypes)
    if (isModification(item)) {
      // Scenariusz 1: EDYCJA (obiekt ma ID)
      console.log(`Aktualizacja ${item.dataType} o ID: ${item.id}`, item);
      
      // Wysłanie do ujednoliconej funkcji aktualizacji
      //updateEvent(item); // Załóżmy, że updateEvent obsłuży Task/Event
    } else {
      // Scenariusz 2: TWORZENIE (obiekt jest Draftem bez ID)
      // W tym bloku 'item' ma gwarancję, że jest typu ItemDraft (EventDraft | TaskDraft)
      console.log(`Dodawanie nowego ${item.dataType}:`, item);
      
      // Wysłanie do ujednoliconej funkcji dodawania
      if (item.dataType === 'event') {
          //addEvent(item as ItemDraft);
      } 
      // Analogicznie, jeśli obsługujesz Taski, tutaj byłoby:
      // else if (item.dataType === 'task') {
      //     addTask(item as TaskDraft); 
      // }
    }
  };

  const handleOnDelete = (id: string) => {
    // Tutaj logika usunięcia
    console.log("Usuwanie elementu o ID:", id);
    deleteEvent(id);
    handleFormClose();
  }

  // Ujednolicona funkcja do otwierania modala
  const handleFormOpen = (
      // Typy wejściowe z react-big-calendar
      interactionData: 
          | { start: Date, end: Date, slots: Date[] } // onSelectSlot
          | Event // onSelectEvent
          | any // onEventDrop / onEventResize (dla uproszczenia typowania D&D)
      
  ) => {
      let draft: ItemToEdit = null;

      if ('start' in interactionData && 'end' in interactionData && 'slots' in interactionData) {
          // SCENARIUSZ 1: KLIKNIĘCIE W PUSTY SLOT (TWORZENIE NOWEGO EVENTU)
          const slotInfo = interactionData;
          
          draft = {
              dataType: 'event', // Nowy element jest domyślnie Eventem
              title: 'Nowe wydarzenie',
              start: slotInfo.start,
              end: slotInfo.end,
              // ... ustaw inne domyślne pola dla Eventu ...
          } as Omit<Event, 'id'>; // Typujemy jako Draft Eventu
          
          // Otwieramy modal z danymi
          setItemToEdit(draft); 
      
      } else if ('id' in interactionData && 'dataType' in interactionData) {
          // SCENARIUSZ 2: KLIKNIĘCIE W ISTNIEJĄCY EVENT/TASK (EDYCJA)
          const item = interactionData as Event | Task;
          
          // Używamy pełnego obiektu z ID do edycji
          setItemToEdit(item); 
      } else if ('event' in interactionData && ('start' in interactionData || 'end' in interactionData)) {
          // SCENARIUSZ 3: ZAKOŃCZENIE D&D LUB ZMIANY ROZMIARU (NATYCHMIASTOWA AKTUALIZACJA)
          const { event, start, end } = interactionData;
          
          // Konwersja dat
          const newStart = typeof start === 'string' ? new Date(start) : start;
          const newEnd = typeof end === 'string' ? new Date(end) : end;

          // Tworzymy zaktualizowany obiekt
          const updatedItem = {
              ...event,
              start: newStart,
              end: newEnd,
              // ... obsługa allDay i innych pól D&D
          } as Event; // Zakładamy, że D&D dotyczy tylko Eventów

          // Natychmiast wysyłamy do API, BEZ otwierania modala
          handleUnifiedSubmit(updatedItem); 

          return; // Zakończ, nie otwieraj modala

      } else {
          // Nieznana interakcja, zamykamy modal i nic nie robimy
          setItemToEdit(null);
      }
  };

  return (
    <div>
      <DndProvider backend={HTML5Backend}>
        <div className="h-screen p-4">
          <h1 className="text-xl font-bold mb-4">Mój Kalendarz</h1>
          <DndCalendar
            localizer={localizer}
            events={events}
            startAccessor={(event: Event) => event.start} 
            endAccessor={(event: Event) => event.end}   
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
      {itemToEdit !== null && (
        <FormDisplay 
            initialData={itemToEdit} 
            onSubmit={handleUnifiedSubmit} // Ujednolicony handler submitu
            onClose={handleFormClose}
            onDelete={handleOnDelete}
        />
    )}
    </div>
  );
}

export default MyCalendar;