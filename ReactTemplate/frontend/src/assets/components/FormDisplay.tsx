import 'tailwindcss';
import React, { useState, useCallback, useEffect } from 'react';
import * as TaskTypes from '../types/taskTypes';

// Stałe dla kategorii Eventów (zgodne z MyCalendar.tsx)
const EVENT_CATEGORIES = [
    { value: 'praca', label: 'Praca' },
    { value: 'prywatne', label: 'Prywatne' },
    { value: 'inne', label: 'Inne' },
];

// Dostępne jednostki powtarzalności
const FREQUENCY_OPTIONS = [
    { value: 'daily', label: 'Dni' },
    { value: 'weekly', label: 'Tygodnie' },
    { value: 'monthly', label: 'Miesiące' },
    { value: 'yearly', label: 'Lata' },
];

interface FormProps {
    initialData: TaskTypes.ItemToEdit;
    onSubmit: (item: TaskTypes.EditableItem | TaskTypes.ItemDraft) => void;
    onClose: () => void;
    onDelete: (id: string) => void;
}

function FormDisplay(props: FormProps) {
    if (!props.initialData) return null;

    const [formData, setFormData] = useState<TaskTypes.ItemToEdit>(props.initialData); 
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        setFormData(props.initialData);
    }, [props.initialData]);

    const isEditing = TaskTypes.isModification(props.initialData);
    const isEventType = TaskTypes.isEvent(formData);
    const itemTypeLabel = isEventType ? "Wydarzenie (Event)" : "Zadanie (Task)";
    const itemActionLabel = isEditing 
        ? `Edycja: ${formData?.title || 'Brak tytułu'}` 
        : `Tworzenie: ${itemTypeLabel}`;

    // --- Utility Functions ---

    const formatDateInput = (date: Date): string => {
        if (!(date instanceof Date) || isNaN(date.getTime())) return '';
        return date.toISOString().slice(0, 16); 
    };

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        setFormData(prev => {
            if (!prev) return null;
            
            // Obsługa dat
            if (name === 'start' || name === 'end' || name === 'deadline') {
                const dateValue = new Date(value);
                if (isNaN(dateValue.getTime())) return prev; 
                return { ...prev, [name]: dateValue };
            }

            // Obsługa checkboxów
            if (type === 'checkbox') {
                // Jeśli wyłączamy cykliczność, usuwamy też pole recurrence
                if (name === 'cyclical' && !(e.target as HTMLInputElement).checked) {
                    const { recurrence, ...rest } = prev;
                    return { ...rest, cyclical: false };
                }
                return { ...prev, [name]: (e.target as HTMLInputElement).checked };
            }
            
            // Obsługa pozostałych pól
            return { ...prev, [name]: value };
        });
    }, []);
    
    // Ujednolicony handler dla pól Recurrence
    const handleRecurrenceChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setFormData(prev => {
            if (!prev || !prev.cyclical) return prev;

            // Inicjalizacja domyślnej reguły powtarzania, jeśli jej brakuje
            const currentRecurrence = prev.recurrence || { frequency: 'weekly', interval: 1 };
            let updatedRecurrence = { ...currentRecurrence };

            if (name === 'interval') {
                // Zapewniamy, że interwał jest liczbą >= 1
                updatedRecurrence.interval = Math.max(1, parseInt(value) || 1);
            } else if (name === 'untilDate') {
                // Konwersja daty lub ustawienie na undefined/null jeśli puste
                updatedRecurrence.untilDate = value ? new Date(value) : undefined;
            } else if (name === 'frequency') {
                updatedRecurrence.frequency = value as TaskTypes.Recurrence['frequency'];
            }

            return { ...prev, recurrence: updatedRecurrence };
        });
    }, []);

    const handleTabClick = (newType: 'event' | 'task') => {
        if (!formData || isEditing || formData.dataType === newType) return; 

        // Pobieramy pola wspólne i cykliczność
        const commonFields = {
            title: formData.title || (newType === 'task' ? 'Nowe zadanie' : 'Nowe wydarzenie'),
            details: formData.details,
            cyclical: formData.cyclical,
            recurrence: formData.recurrence,
        };

        if (newType === 'task') {
            const eventAsDraft = formData as TaskTypes.EventDraft;
            const taskDraft: TaskTypes.TaskDraft = {
                dataType: 'task',
                ...commonFields,
                deadline: eventAsDraft.start || new Date(), // Używamy start jako domyślny deadline
                progress: 'planned',
                category: 'mind', // Domyślna kategoria Taska
            };
            setFormData(taskDraft);
        } else if (newType === 'event') {
            const taskAsDraft = formData as TaskTypes.TaskDraft;
            const defaultCategory = EVENT_CATEGORIES.find(c => c.value === taskAsDraft.category)?.value || EVENT_CATEGORIES[0].value;

            const eventDraft: TaskTypes.EventDraft = {
                dataType: 'event',
                ...commonFields,
                start: taskAsDraft.deadline || new Date(),
                end: new Date((taskAsDraft.deadline || new Date()).getTime() + 60 * 60 * 1000), // Domyślny koniec: +1h
                allDay: false,
                category: defaultCategory,
            };
            setFormData(eventDraft);
        }
    }

    const handleSave = () => {
        if (formData) {
            if (!formData.title || formData.title.trim() === '') {
                console.error("Błąd: Tytuł jest wymagany.");
                return; 
            }
            
            // Walidacja cykliczności: jeśli cykliczne, musi mieć recurrence i interwał >= 1
            if (formData.cyclical) {
                 if (!formData.recurrence || (formData.recurrence.interval || 0) < 1) {
                     console.error("Błąd: Element cykliczny musi mieć interwał większy niż 0.");
                     return;
                 }
            }
            
            props.onSubmit(formData as TaskTypes.EditableItem | TaskTypes.ItemDraft);
        }
    };

    const handleDeleteClick = () => {
        if (isEditing) setConfirmDelete(true);
    };

    const confirmDeletion = () => {
        if (TaskTypes.isModification(props.initialData)) {
            props.onDelete(props.initialData.id); 
        } else {
            console.error("Nie można usunąć, ponieważ brakuje ID elementu.");
        }
        setConfirmDelete(false);
    };

    // --- Recurrence Picker Component (Zagnieżdżony) ---
    const RecurrencePicker: React.FC = () => {
        const rec = formData?.recurrence || { frequency: 'weekly', interval: 1 };
        
        return (
            <div className="border border-indigo-200 p-3 rounded-lg bg-indigo-50 space-y-3 mt-3">
                <h4 className="text-sm font-semibold text-indigo-700">Reguła Powtarzania</h4>
                <div className="grid grid-cols-3 gap-3 items-center">
                    {/* Interwał */}
                    <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-600">Powtarzaj co</label>
                        <input
                            type="number"
                            name="interval"
                            min="1"
                            value={rec.interval}
                            onChange={handleRecurrenceChange}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>
                    {/* Częstotliwość */}
                    <div className="col-span-2">
                         <label className="block text-xs font-medium text-gray-600">Jednostka czasu</label>
                         <select
                            name="frequency"
                            value={rec.frequency}
                            onChange={handleRecurrenceChange}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                         >
                            {FREQUENCY_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                         </select>
                    </div>
                </div>
                
                {/* Data Końcowa */}
                <div>
                     <label className="block text-xs font-medium text-gray-600">Powtarzaj do (opcjonalnie)</label>
                     <input
                        type="datetime-local"
                        name="untilDate"
                        // Używamy opcjonalnego łańcuchowania i formatDateInput, jeśli untilDate istnieje
                        value={rec.untilDate instanceof Date && !isNaN(rec.untilDate.getTime()) ? formatDateInput(rec.untilDate) : ''}
                        onChange={handleRecurrenceChange}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                     />
                </div>
            </div>
        );
    };
    // --- End Recurrence Picker Component ---


    const renderFormFields = () => {
        if (!formData) return null;
        const currentItem = formData; 

        return (
            <div className="space-y-4">
                {/* 1. Tytuł */}
                 <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Tytuł</label>
                    <input 
                        id="title"
                        type="text" 
                        name="title"
                        value={currentItem.title || ''} 
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Wpisz tytuł..."
                    />
                </div>

                {/* 2. Pole 'Szczegóły' - wspólne dla obu typów */}
                <div>
                    <label htmlFor="details" className="block text-sm font-medium text-gray-700">Szczegóły (opcjonalnie)</label>
                    <textarea 
                        id="details"
                        name="details"
                        value={currentItem.details || ''} 
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        placeholder="Dodaj szczegółowy opis..."
                    />
                </div>
                
                {/* 3. Pola specyficzne dla Eventu */}
                {isEventType && TaskTypes.isEvent(currentItem) && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                             <label htmlFor="eventCategory" className="block text-sm font-medium text-gray-700">Kategoria Eventu</label>
                             <select
                                id="eventCategory"
                                name="category"
                                value={currentItem.category || EVENT_CATEGORIES[0].value}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                             >
                                {EVENT_CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                             </select>
                        </div>
                        <div>
                            <label htmlFor="start" className="block text-sm font-medium text-gray-700">Początek</label>
                            <input
                                id="start"
                                type="datetime-local"
                                name="start"
                                value={formatDateInput(currentItem.start)}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label htmlFor="end" className="block text-sm font-medium text-gray-700">Koniec</label>
                            <input
                                id="end"
                                type="datetime-local"
                                name="end"
                                value={formatDateInput(currentItem.end)}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="flex items-center col-span-2">
                            <input
                                id="allDay"
                                name="allDay"
                                type="checkbox"
                                checked={currentItem.allDay}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            />
                            <label htmlFor="allDay" className="ml-2 block text-sm text-gray-900">
                                Całodniowe
                            </label>
                        </div>
                    </div>
                )}

                {/* 4. Pola specyficzne dla Tasku */}
                {!isEventType && TaskTypes.isTask(currentItem) && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">Deadline (Termin)</label>
                            <input
                                id="deadline"
                                type="datetime-local"
                                name="deadline"
                                value={formatDateInput(currentItem.deadline)}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                         {/* Progress */}
                        <div>
                            <label htmlFor="progress" className="block text-sm font-medium text-gray-700">Postęp</label>
                            <select
                                id="progress"
                                name="progress"
                                value={currentItem.progress}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            >
                                <option value="planned">Planowane</option>
                                <option value="working on it">W trakcie</option>
                                <option value="completed">Zakończone</option>
                            </select>
                        </div>
                         {/* Category */}
                        <div className="col-span-2">
                            <label htmlFor="taskCategory" className="block text-sm font-medium text-gray-700">Kategoria</label>
                            <select
                                id="taskCategory"
                                name="category"
                                value={currentItem.category}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            >
                                <option value="mind">Umysł (Mind)</option>
                                <option value="physical">Fizyczność (Physical)</option>
                                <option value="social">Społeczne (Social)</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* 5. Pole Cykliczne (wspólne) */}
                <div className="flex items-center pt-2">
                    <input
                        id="cyclical"
                        name="cyclical"
                        type="checkbox"
                        checked={currentItem.cyclical || false}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label htmlFor="cyclical" className="ml-2 block text-sm text-gray-900">
                        Element cykliczny/powtarzalny
                    </label>
                </div>

                {/* 6. Recurrence Picker - wyświetlany tylko gdy zaznaczono cykliczność */}
                {currentItem.cyclical && <RecurrencePicker />}
                
            </div>
        );
    };

    return(
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 transform transition-all duration-300 scale-100">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-4 border-b pb-3">
                    {itemActionLabel}
                </h2>
                
                {/* Przyciski Zakładek (tylko przy tworzeniu) */}
                {!isEditing && (
                    <div className="flex mb-6 p-1 bg-gray-100 rounded-lg space-x-1">
                        <button 
                            onClick={() => handleTabClick('event')} 
                            className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition duration-150 ${isEventType ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'}`}
                        >
                            Wydarzenie (Event)
                        </button>
                        <button 
                            onClick={() => handleTabClick('task')} 
                            className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition duration-150 ${!isEventType ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'}`}
                        >
                            Zadanie (Task)
                        </button>
                    </div>
                )}

                {renderFormFields()}

                <div className="flex justify-between mt-8 pt-4 border-t">
                    <button 
                        onClick={props.onClose}
                        className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition duration-150 shadow-sm"
                    >
                        Anuluj
                    </button>

                    <div className="space-x-3 flex items-center">
                        {isEditing && (
                            <button 
                                onClick={handleDeleteClick}
                                className="px-6 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition duration-150 shadow-md"
                            >
                                Usuń
                            </button>
                        )}
                        <button 
                            onClick={handleSave}
                            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md"
                        >
                            {isEditing ? 'Zapisz zmiany' : 'Dodaj nowy'}
                        </button>
                    </div>
                </div>

                {/* MODAL POTWIERDZENIA USUNIĘCIA (Warstwa) */}
                {confirmDelete && (
                    <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center rounded-xl backdrop-blur-sm">
                        <div className="text-center p-8 bg-white border border-red-200 rounded-xl shadow-xl">
                            <p className="mb-6 text-lg font-semibold text-gray-800">Czy na pewno chcesz usunąć ten element?</p>
                            <div className="space-x-4">
                                <button 
                                    onClick={() => setConfirmDelete(false)}
                                    className="px-5 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400"
                                >
                                    Nie, Anuluj
                                </button>
                                <button 
                                    onClick={confirmDeletion}
                                    className="px-5 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                                >
                                    Tak, Usuń na stałe
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default FormDisplay;