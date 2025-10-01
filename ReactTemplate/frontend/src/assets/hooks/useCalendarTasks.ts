import { useState, useEffect } from 'react';
import axios from 'axios';
// Importuj też swoje typy, jeśli masz je w innym pliku
import { type TaskApi, type CalendarEvent } from '../types/taskTypes.ts';

const API_URL = 'http://localhost:3001/api/tasks';

export function useCalendarTasks(){
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  // Logika konwersji String -> Date
    const mapApiToCalendar = (tasks: TaskApi[]): CalendarEvent[] => {
        return tasks.map(task => ({
            ...task,
            start: new Date(task.start),
            end: new Date(task.end)
        }));
    };

    // Logika konwersji Date -> String (na potrzeby wysyłki)
    const mapCalendarToApi = (event: CalendarEvent): TaskApi => {
        return {
            ...event,
            start: event.start.toISOString(),
            end: event.end.toISOString()
        }
    }

    const fetchTasks = async () => {
        try {
            const response = await axios.get<TaskApi[]>(API_URL);
            setEvents(mapApiToCalendar(response.data));
        } catch (error) {
            console.error("Błąd podczas pobierania zadań:", error);
        }
    };

    const addTask = async(newTaskData: Omit<CalendarEvent, 'id'>) =>{
      const apiData = mapCalendarToApi(newTaskData as CalendarEvent);
      try {
        const response = await axios.post<TaskApi>(API_URL, apiData);
        const newEvent = mapApiToCalendar([response.data])[0];
        setEvents(prevEvents => [...prevEvents, newEvent]);
      } catch (error) {
        console.error("Błąd podczas dodawania zadania:", error);
      }
    }

    const updateTask = async(updatedEvent: CalendarEvent) =>{
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

    const deleteTask = async(taskId: string) =>{
      try {
        await axios.delete(`${API_URL}/${taskId}`);
        setEvents(prevEvents => prevEvents.filter(e => e.id !== taskId));
      } catch (error) {
         console.error("Błąd podczas usuwania zadania:", error);
      }
    }

  useEffect(() => {
    fetchTasks();
  }, []);

  return { events, addTask, updateTask, deleteTask };
}