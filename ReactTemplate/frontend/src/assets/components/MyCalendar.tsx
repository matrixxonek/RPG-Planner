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
// Import Typów i Guardów - NAPRAWIONO BŁĄD 'EventDraft'
// --------------------------------------------------------------------------
import type { 
    Event, Task, EditableItem, ItemDraft, ItemToEdit,
    // DODANO BRAKUJĄCE TYPY DRAFTÓW
    EventDraft, TaskDraft
} from '../types/taskTypes'; 
import { 
    isModification, isTask, isEvent, 
} from '../types/taskTypes'; 

// ZMIENIONY IMPORT: Używamy ujednoliconego hooka
import { useCalendarItems } from '../hooks/useCalendarTasks.ts'; 
import FormDisplay from './FormDisplay.tsx';

// --- CUSTOM EVENT COMPONENT ---
// Ten komponent odpowiada za renderowanie zawartości bloku Task/Event
interface CustomEventProps {
    event: EditableItem;
    title: string;
}

const CustomEvent: React.FC<CustomEventProps> = ({ event, title }) => {
    const isTaskItem = isTask(event);
    
    const taskStyle: React.CSSProperties = {
        cursor: isTaskItem ? 'default' : 'pointer',
        fontWeight: isTaskItem ? 'bold' : 'normal',
        whiteSpace: 'normal', 
        lineHeight: '1.2'
    };
    
    const isCompleted = isTaskItem && (event as Task).progress === 'completed';
    
    return (
        <div style={taskStyle} title={event.details}>
            {isCompleted && <span className="mr-1">✅</span>}
            <span className="text-sm">{title}</span>
        </div>
    );
};
// --- END CUSTOM EVENT COMPONENT ---


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
            cyclical: false, // Domyślnie NIE cykliczny
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
  
  // FUNKCJA DODAJĄCA STYLE I ATTRYBUTY DLA ZDARZEŃ W KALENDARZU
  const eventPropGetter = (event: EditableItem) => {
      let style: React.CSSProperties = {};
      let attributes: { draggable?: boolean, resizable?: boolean, className?: string } = {}; 

      // Używamy Type Guard do określenia, czy to Task
      if (isTask(event)) {
          const task = event as Task;
          
          // BLOKADA D&D i RESIZE DLA TASKÓW
          attributes.draggable = false;
          attributes.resizable = false;
          
          // Używamy kodów HEX dla CSS
          const colorMap: { [key in Task['category']]: string } = {
              'mind': '#3b82f6', // blue-500
              'physical': '#10b981', // green-500
              'social': '#ef4444' // red-500
          };
          
          const baseColor = colorMap[task.category] || '#6b7280';
          
          style = {
              backgroundColor: baseColor,
              borderRadius: '5px',
              opacity: 1,
              color: 'white',
              border: `1px solid ${baseColor}`,
              pointerEvents: 'none', // Definitywnie blokuje interakcję myszy z Taskiem
          };
          
          // Jeśli Task jest zakończony, przyciemniamy
          if (task.progress === 'completed') {
              style = { ...style, opacity: 0.4, border: 'none' };
          }

      } else if (isEvent(event)) {
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
          <div className="shadow-xl rounded-lg overflow-hidden bg-white p-4">
            <DndCalendar
              localizer={localizer}
              events={events} // Zunifikowana lista Eventów i Tasków (EditableItem[])
              // POPRAWIONE: Używamy daty deadline dla Taska jako startu i końca
              startAccessor={(item: EditableItem) => item.dataType === 'event' ? (item as Event).start : (item as Task).deadline} 
              endAccessor={(item: EditableItem) => item.dataType === 'event' ? (item as Event).end : (item as Task).deadline} 
              
              // DODANO: Funkcja do kolorowania, blokady D&D i tytułów
              eventPropGetter={eventPropGetter} 
             
             // UŻYCIE WŁASNEGO KOMPONENTU DO RENDEROWANIA
             components={{
                 event: CustomEvent 
             }}

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
              // NAPRAWIONO: onSelectEvent musi przyjmować EditableItem
              onSelectEvent={(event: EditableItem) => setItemToEdit(event)}
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
