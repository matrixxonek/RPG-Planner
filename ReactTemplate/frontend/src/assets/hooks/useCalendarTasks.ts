import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    type Event, 
    type EventApi, 
    type Task, 
    type TaskApi,
    type EditableItem, // Event | Task
    type ItemDraft,    // Omit<Event, 'id'> | Omit<Task, 'id'>
    isEvent,           // Type guard
    isModification     // Type guard
} from '../types/taskTypes'; // Zakładam, że przeniosłeś tam Type Guards

// Adresy endpointów
const API_BASE_URL = 'http://localhost:3001/api';
const EVENTS_URL = `${API_BASE_URL}/events`;
const TASKS_URL = `${API_BASE_URL}/tasks`;


/**
 * Hook do zarządzania Taskami i Eventami z API.
 * Obsługuje konsolidację danych po stronie klienta (Client-Side Aggregation).
 */
export function useCalendarItems(){
    // Używamy zunifikowanego stanu na wszystkie elementy kalendarza
    const [calendarItems, setCalendarItems] = useState<EditableItem[]>([]); 

    // --- Konwersja Danych ---

    /** Konwertuje EventApi (string dates) na Event (Date objects) */
    const mapEventApiToCalendar = (apiData: EventApi[]): Event[] => {
        return apiData.map(event => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end)
        }));
    };

    /** Konwertuje TaskApi (string date) na Task (Date object) */
    const mapTaskApiToCalendar = (apiData: TaskApi[]): Task[] => {
        return apiData.map(task => ({
            ...task,
            deadline: new Date(task.deadline),
        }));
    };

    /** Konwertuje Event (Date objects) na EventApi (string dates) */
    const mapEventToApi = (item: Event): EventApi => ({
        ...item,
        start: item.start.toISOString(),
        end: item.end.toISOString()
    });
    
    /** Konwertuje Task (Date object) na TaskApi (string date) */
    const mapTaskToApi = (item: Task): TaskApi => ({
        ...item,
        deadline: item.deadline.toISOString(),
    });

    // --- Pobieranie Danych (GET) ---

    const fetchAllItems = async () => {
        try {
            // 1. Pobierz Eventy
            const eventsPromise = axios.get<EventApi[]>(EVENTS_URL);
            // 2. Pobierz Taski
            const tasksPromise = axios.get<TaskApi[]>(TASKS_URL);

            // Czekaj na oba żądania jednocześnie
            const [eventsResponse, tasksResponse] = await Promise.all([eventsPromise, tasksPromise]);

            // 3. Konwertuj i połącz
            const events = mapEventApiToCalendar(eventsResponse.data);
            const tasks = mapTaskApiToCalendar(tasksResponse.data);

            const combined = [...events, ...tasks];
            
            // Opcjonalne: sortowanie wszystkich elementów po dacie start/deadline
            const sortedItems = combined.sort((a, b) => {
                 // Dla prostoty sortujemy tylko po start/deadline.
                 // Użyjemy isEvent jako type guard, by wiedzieć, którą datę wziąć.
                 const dateA = isEvent(a) ? a.start.getTime() : a.deadline.getTime();
                 const dateB = isEvent(b) ? b.start.getTime() : b.deadline.getTime();
                 return dateA - dateB;
            });
            
            setCalendarItems(sortedItems);

        } catch (error) {
            console.error("Błąd podczas pobierania elementów kalendarza:", error);
        }
    };

    // --- Funkcje CRUD ---

    // Nowa funkcja do dodawania (Draft bez ID)
    const addItem = async(newItemData: ItemDraft) => {
        try {
            let response;
            let newItem: EditableItem;
            
            if (isEvent(newItemData)) {
                // To jest EventDraft
                const apiData = mapEventToApi(newItemData as Event);
                response = await axios.post<EventApi>(EVENTS_URL, apiData);
                newItem = mapEventApiToCalendar([response.data])[0];
            } else {
                // To jest TaskDraft
                const apiData = mapTaskToApi(newItemData as Task);
                response = await axios.post<TaskApi>(TASKS_URL, apiData);
                newItem = mapTaskApiToCalendar([response.data])[0];
            }
            
            setCalendarItems(prevItems => [...prevItems, newItem]);

        } catch (error) {
            console.error("Błąd podczas dodawania elementu:", error);
        }
    }

    // Nowa funkcja do aktualizacji (EditableItem z ID)
    const updateItem = async(updatedItem: EditableItem) => {
        try {
            const URL = isEvent(updatedItem) ? EVENTS_URL : TASKS_URL;
            let apiData: EventApi | TaskApi;

            if (isEvent(updatedItem)) {
                apiData = mapEventToApi(updatedItem as Event);
            } else {
                apiData = mapTaskToApi(updatedItem as Task);
            }
            
            await axios.put(`${URL}/${updatedItem.id}`, apiData);
            
            setCalendarItems(prevItems => 
                prevItems.map(item => 
                    item.id === updatedItem.id && item.dataType === updatedItem.dataType 
                        ? updatedItem 
                        : item
                )
            );
        } catch (error) {
            console.error("Błąd podczas aktualizacji elementu:", error);
        }
    };

    // Nowa funkcja do usuwania (na podstawie ID i dataType)
    const deleteItem = async(itemId: string, itemType: 'event' | 'task') => {
        const URL = itemType === 'event' ? EVENTS_URL : TASKS_URL;
        
        try {
            await axios.delete(`${URL}/${itemId}`);
            setCalendarItems(prevItems => 
                prevItems.filter(i => !(i.id === itemId && i.dataType === itemType))
            );
        } catch (error) {
             console.error("Błąd podczas usuwania elementu:", error);
        }
    }
    
    // Uruchomienie pobierania danych przy montowaniu komponentu
    useEffect(() => {
        fetchAllItems();
    }, []);

    // Zwracamy zunifikowaną listę jako 'events' (dla kompatybilności z RBC)
    return { 
        events: calendarItems, 
        addEvent: addItem,      // Zmieniamy nazwę na addItem 
        updateEvent: updateItem, // Zmieniamy nazwę na updateItem
        deleteEvent: deleteItem, // Musimy dostosować jej użycie w MyCalendar
    };
}
