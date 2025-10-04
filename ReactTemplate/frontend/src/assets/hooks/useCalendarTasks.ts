import { useState, useEffect } from 'react';
import axios from 'axios';
import { type EventApi, type CalendarEvent } from '../types/taskTypes.ts';

const API_URL = 'http://localhost:3001/api/events';

export function useCalendarEvents(){
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  // Logika konwersji String -> Date
    const mapApiToCalendar = (events: EventApi[]): CalendarEvent[] => {
        return events.map(event => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end)
        }));
    };

    // Logika konwersji Date -> String (na potrzeby wysyłki)
    const mapCalendarToApi = (event: CalendarEvent): EventApi => {
        return {
            ...event,
            start: event.start.toISOString(),
            end: event.end.toISOString()
        }
    }

    const fetchevents = async () => {
        try {
            const response = await axios.get<EventApi[]>(API_URL);
            setEvents(mapApiToCalendar(response.data));
        } catch (error) {
            console.error("Błąd podczas pobierania zadań:", error);
        }
    };

    const addEvent = async(neweventData: Omit<CalendarEvent, 'id'>) =>{
      const apiData = mapCalendarToApi(neweventData as CalendarEvent);
      try {
        const response = await axios.post<EventApi>(API_URL, apiData);
        const newEvent = mapApiToCalendar([response.data])[0];
        setEvents(prevEvents => [...prevEvents, newEvent]);
      } catch (error) {
        console.error("Błąd podczas dodawania zadania:", error);
      }
    }

    const updateEvent = async(updatedEvent: CalendarEvent) =>{
      const apiData = mapCalendarToApi(updatedEvent);
      try {
        await axios.put(`${API_URL}/${updatedEvent.id}`, apiData);
        setEvents(prevEvents => 
          prevEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e)
        );
      } catch (error) {
        console.error("Błąd podczas aktualizacji zadania:", error);
      }
    };

    const deleteEvent = async(eventId: string) =>{
      try {
        await axios.delete(`${API_URL}/${eventId}`);
        setEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
      } catch (error) {
         console.error("Błąd podczas usuwania zadania:", error);
      }
    }

  useEffect(() => {
    fetchevents();
  }, []);

  return { events, addEvent, updateEvent, deleteEvent };
}