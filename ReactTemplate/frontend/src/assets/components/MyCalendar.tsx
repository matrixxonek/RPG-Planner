import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { Calendar, dateFnsLocalizer, type View, type CalendarProps } from "react-big-calendar";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import "react-big-calendar/lib/addons/dragAndDrop/styles.css"; 
import React, { useState } from "react";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { pl } from "date-fns/locale"; 
import "react-big-calendar/lib/css/react-big-calendar.css";

// --------------------------------------------------------------------------
// SYMULACJA TYPÓW z '../types/taskTypes.ts' (Dla runnable kodu)
// --------------------------------------------------------------------------
interface BaseItem {
    id: string;
    title: string;
    dataType: 'event' | 'task';
    cyclical?: boolean;
    details?: string;
}
export interface Event extends BaseItem {
    dataType: 'event';
    start: Date;
    end: Date;
    allDay: boolean;
    category?: string; 
}
export interface Task extends BaseItem {
    dataType: 'task';
    deadline: Date;
    progress: 'planned' | 'working on it' | 'completed'; 
    category: 'mind' | 'physical' | 'social'; 
}
export type EditableItem = Event | Task;
export type EventDraft = Omit<Event, 'id'>;
export type TaskDraft = Omit<Task, 'id'>;
export type ItemDraft = EventDraft | TaskDraft;
export type ItemToEdit = EditableItem | ItemDraft | null;

export const isModification = (item: ItemToEdit): item is EditableItem => {
    return !!item && typeof item === 'object' && 'id' in item && typeof (item as any).id === 'string' && (item as any).id.length > 0;
};
// Type Guards dla kalendarza
export const isTask = (item: EditableItem | ItemDraft | null): item is Task | TaskDraft => {
    return !!item && item.dataType === 'task';
};

// --------------------------------------------------------------------------
// ZMIENIONY IMPORT: Używamy ujednoliconego hooka
import { useCalendarItems } from '../hooks/useCalendarTasks.ts'; 
import FormDisplay from './FormDisplay.tsx';

interface DndProps<TEvent extends object> extends CalendarProps<TEvent> {
    draggable: boolean;
    resizable: boolean;
    onEventDrop: (args: any) => void;
    onEventResize: (args: any) => void;
}

const locales = {
  pl: pl,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Używamy EditableItem jako typu generycznego, aby obsłużyć Eventy i Taski
const DndCalendar = withDragAndDrop(Calendar) as React.ComponentType<DndProps<EditableItem>>;

function MyCalendar() {
  // Dekonstrukcja z użyciem aliasów (addItem, updateItem, deleteItem)
  const { 
    events, // events to teraz EditableItem[] (Event | Task)
    addEvent: addItem, 
    updateEvent: updateItem, 
    deleteEvent: deleteItem 
  } = useCalendarItems(); 
  
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState<Date | undefined>(undefined);
  const [itemToEdit, setItemToEdit] = useState<ItemToEdit>(null); 

  const handleFormClose = () => setItemToEdit(null); 

  // Ujednolicona funkcja submit, wywołuje ujednolicony hook
  const handleUnifiedSubmit = (item: ItemToEdit) => {
    if (!item) return;

    handleFormClose(); 

    if (isModification(item)) {
      // EDYCJA: Wzywamy updateItem
      updateItem(item); 
    } else {
      // TWORZENIE: Wzywamy addItem
      addItem(item as ItemDraft); 
    }
  };

  // Logika usuwania: znajduje pełny obiekt, aby przekazać ID i dataType do hooka
  const handleOnDelete = (item: EditableItem) => {
    if (!item || !item.id) return;

    // Wzywamy ujednoliconą funkcję deleteItem, podając ID i typ
    deleteItem(item.id, item.dataType);
    handleFormClose();
  }

  // Funkcja pomocnicza dla FormDisplay, aby znaleźć pełny obiekt do usunięcia
  const handleDeleteWrapper = (id: string) => {
    const itemToDelete = events.find(item => item.id === id);
    if (itemToDelete) {
        handleOnDelete(itemToDelete);
    } else {
        console.error(`Nie znaleziono elementu o ID: ${id} do usunięcia.`);
    }
  };

  // Ujednolicona funkcja do otwierania modala
  const handleFormOpen = (
      interactionData: 
        | { start: Date, end: Date, slots: Date[] } // onSelectSlot
        | Event // onSelectEvent
        | any // D&D
  ) => {
      let itemForEdit: ItemToEdit = null;

      if ('start' in interactionData && 'end' in interactionData && 'slots' in interactionData) {
          // SCENARIUSZ 1: TWORZENIE NOWEGO EVENTU (DRAFT)
          const slotInfo = interactionData;
          
          itemForEdit = {
              dataType: 'event', 
              title: 'Nowe wydarzenie',
              start: slotInfo.start,
              end: slotInfo.end,
              allDay: false, 
          } as EventDraft;
          
      } else if ('id' in interactionData && 'dataType' in interactionData) {
          // SCENARI2: KLIKNIĘCIE W ISTNIEJĄCY ELEMENT (EDYCJA)
          const item = interactionData as EditableItem;
          itemForEdit = item; 
      } else if ('event' in interactionData && ('start' in interactionData || 'end' in interactionData)) {
          // SCENARIUSZ 3: ZAKOŃCZENIE D&D LUB ZMIANY ROZMIARU
          const { event, start, end } = interactionData;
          
          const newStart = typeof start === 'string' ? new Date(start) : start;
          const newEnd = typeof end === 'string' ? new Date(end) : end;

          const updatedItem = {
              ...event,
              start: newStart,
              end: newEnd,
          } as EditableItem; 

          // Natychmiast wysyłamy do API
          handleUnifiedSubmit(updatedItem); 
          return; 
      }
      
      setItemToEdit(itemForEdit); 
  };
  
  // FUNKCJA DODAJĄCA STYLE DLA ZDARZEŃ W KALENDARZU (Kolorowanie + Blokada D&D)
  const eventPropGetter = (event: EditableItem) => {
      let style: React.CSSProperties = {};
      let attributes: { draggable?: boolean, resizable?: boolean, title?: string, className?: string } = {}; // Dodano className i title

      // Używamy Type Guard do określenia, czy to Task
      if (isTask(event)) {
          const task = event as Task;
          
          // CAŁKOWITA BLOKADA D&D i RESIZE DLA TASKÓW
          attributes.draggable = false;
          attributes.resizable = false;
          attributes.className = 'rbc-no-drag'; // Klasa dla ewentualnego nadpisania natywnych stylów RBC
          
          // Ustawienie kursora na "default" usuwa wizualny feedback przeciągania
          style.cursor = 'default'; 
          
          // Ustawienie TITLE dla tooltipa (etykietki narzędziowej)
          attributes.title = task.title;

          // Używamy kodów HEX dla CSS
          const colorMap: { [key in Task['category']]: string } = {
              'mind': '#3b82f6', 
              'physical': '#10b981', 
              'social': '#ef4444' 
          };
          
          const baseColor = colorMap[task.category] || '#6b7280';
          
          style = {
              ...style, // Zachowanie ustawionego kursora
              backgroundColor: baseColor,
              borderRadius: '5px',
              opacity: 1,
              color: 'white',
              border: `1px solid ${baseColor}`,
             whiteSpace: 'normal', // Zezwolenie na zawijanie tytułu
          };
          
          // Jeśli Task jest zakończony, przyciemniamy
          if (task.progress === 'completed') {
              style = { ...style, opacity: 0.4, border: 'none' };
          }

      } else if (event.dataType === 'event') {
          // Ustawienie TITLE dla tooltipa Eventu
          attributes.title = event.title;

          // Logika dla standardowych Eventów (kolorowanie na podstawie kategorii)
          const eventColorMap: { [key: string]: string } = {
              'praca': '#9333ea', // fioletowy
              'prywatne': '#f97316', // pomarańczowy
              'inne': '#6b7280' // szary
          };
          const eventBaseColor = eventColorMap[event.category || ''] || '#6b7280';

          style = {
              backgroundColor: eventBaseColor,
              borderRadius: '5px',
              opacity: 0.9,
              border: 'none',
             whiteSpace: 'normal', 
          };
      }
      
      // Zwracamy styl i atrybuty
      return { style, ...attributes };
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <DndProvider backend={HTML5Backend}>
        <div className="container mx-auto p-4 md:p-8">
          <h1 className="text-3xl font-extrabold text-indigo-700 mb-6 border-b-2 border-indigo-200 pb-2">
            Mój Kalendarz Zadań i Wydarzeń
          </h1>
          <div className className="shadow-xl rounded-lg overflow-hidden bg-white p-4">
            <DndCalendar
              localizer={localizer}
              events={events} // Zunifikowana lista Eventów i Tasków (EditableItem[])
              // POPRAWIONE: Używamy daty deadline dla Taska jako startu i końca
              startAccessor={(item: EditableItem) => item.dataType === 'event' ? (item as Event).start : (item as Task).deadline} 
              endAccessor={(item: EditableItem) => item.dataType === 'event' ? (item as Event).end : (item as Task).deadline} 
              
              // DODANO: Funkcja do kolorowania, blokady D&D i tytułów
              eventPropGetter={eventPropGetter} 
              
              defaultView="month"
              views={["month", "week", "day"]}
              style={{ height: "70vh" }}
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
        </div>
      </DndProvider>
      {/* MODAL / FORMULARZ WARUNKOWY */}
      {itemToEdit !== null && (
        <FormDisplay 
            initialData={itemToEdit} 
            onSubmit={handleUnifiedSubmit} 
            onClose={handleFormClose}
            onDelete={handleDeleteWrapper}
        />
      )}
    </div>
  );
}

export default MyCalendar;