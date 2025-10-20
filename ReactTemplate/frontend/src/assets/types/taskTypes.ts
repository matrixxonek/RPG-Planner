// --- Definicje Typów dla Kalendarza i Zadań ---

// =========================================================================
// 1. MODELE DANYCH KLIENTA (JS Date Objects)
// =========================================================================

/**
 * Reprezentuje podstawowy element z dyskryminującym polem dataType.
 */
export interface BaseItem {
    id: string;
    title: string;
    dataType: 'event' | 'task';
    cyclical?: boolean;
    details?: string;
}

/**
 * Reprezentuje Wydarzenie (Event) w kalendarzu. Używa obiektów Date.
 */
export interface Event extends BaseItem {
    dataType: 'event'; 
    start: Date;
    end: Date;
    allDay: boolean;
    category?: string; // Opcjonalne pole kategorii/koloru - dla RBC
}

/**
 * Reprezentuje Zadanie (Task) z terminem wykonania. Używa obiektów Date.
 */
export interface Task extends BaseItem {
    dataType: 'task'; 
    deadline: Date; // Kiedy zadanie powinno być wykonane
    progress: 'planned' | 'working on it' | 'completed'; // Status zadania
    category: 'mind' | 'physical' | 'social';
}


// =========================================================================
// 2. MODELE DANYCH API (String Dates)
// =========================================================================

/**
 * API-friendly wersja Event (daty jako stringi).
 */
export interface EventApi extends Omit<Event, 'start' | 'end'> {
    start: string;
    end: string;
}

/**
 * API-friendly wersja Task (daty jako stringi).
 */
export interface TaskApi extends Omit<Task, 'deadline'> {
    deadline: string;
}

/**
 * Unia wszystkich elementów API.
 */
export type ItemApi = TaskApi | EventApi;


// =========================================================================
// 3. TYPY POMOCNICZE I UNIE
// ZMIANA: Dodano jawną definicję i eksport typów Draft, aby FormDisplay mógł ich używać
// =========================================================================

export type EditableItem = Event | Task; // Element z ID (do edycji/usuwania)

export type EventDraft = Omit<Event, 'id'>;
export type TaskDraft = Omit<Task, 'id'>;

export type ItemDraft = EventDraft | TaskDraft; // Element bez ID (do tworzenia)

// Typ stanu Modala: może być edytowalnym elementem, nowym elementem-draftem, lub null
export type ItemToEdit = EditableItem | ItemDraft | null;


// =========================================================================
// 4. FUNKCJE SPRAWDZAJĄCE TYPY (Type Guards)
// =========================================================================

// Sprawdza, czy element jest Wydarzeniem (Event/Draft)
export const isEvent = (item: ItemToEdit | ItemApi): item is Event | Omit<Event, 'id'> | EventApi => {
    return !!item && item.dataType === 'event';
};

// Sprawdza, czy element jest Zadaniem (Task/Draft)
export const isTask = (item: ItemToEdit | ItemApi): item is Task | Omit<Task, 'id'> | TaskApi => {
    return !!item && item.dataType === 'task';
};

// Sprawdza, czy element ma ID (jest modyfikacją, a nie nowym draftem)
export const isModification = (item: ItemToEdit | ItemApi): item is EditableItem | ItemApi => {
    return !!item && typeof item === 'object' && 'id' in item && typeof (item as any).id === 'string' && (item as any).id.length > 0;
};
