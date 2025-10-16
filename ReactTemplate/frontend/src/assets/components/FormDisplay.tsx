import 'tailwindcss';
import React, { useState, useCallback } from 'react';
import * as TaskTypes from '../types/taskTypes';
interface FormProps {
    initialData: TaskTypes.ItemToEdit;
    onSubmit: (item: TaskTypes.EditableItem | TaskTypes.ItemDraft) => void;
    onClose: () => void;
    onDelete: (id: string) => void;
}

function FormDisplay(props: FormProps){
    if (!props.initialData) return null;

    const [formData, setFormData] = useState<TaskTypes.ItemToEdit>(props.initialData); 
    const [confirmDelete, setConfirmDelete] = useState(false);

    const isEditing = TaskTypes.isModification(props.initialData);
    const isEventType = TaskTypes.isEvent(formData);
    const itemTypeLabel = isEventType ? "Wydarzenie (Event)" : "Zadanie (Task)";
    const itemActionLabel = isEditing 
        ? `Edycja: ${formData?.title || 'Brak tytułu'}` 
        : `Tworzenie: ${itemTypeLabel}`;

    // --- Utility Functions ---

    // Funkcja do formatowania daty dla input[type="datetime-local"]
    const formatDateInput = (date: Date): string => {
        if (!(date instanceof Date) || isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (!prev) return null;

            // Obsługa dat
            if (name === 'start' || name === 'end' || name === 'deadline') {
                const dateValue = new Date(value);
                // Prosta walidacja daty
                if (isNaN(dateValue.getTime())) return prev; 
                return { ...prev, [name]: dateValue };
            }

            // Obsługa checkboxów
            if (e.target.type === 'checkbox') {
                 return { ...prev, [name]: (e.target as HTMLInputElement).checked };
            }
            
            // Obsługa pozostałych pól
            return { ...prev, [name]: value };
        });
    }, []);

    const handleTypeSwitch = () => {
        if (!formData || isEditing) return; // Przełączamy tylko Draft

        if (TaskTypes.isEvent(formData)) {
            // Konwersja na Task Draft
            const eventAsDraft = formData as Omit<TaskTypes.Event, 'id'>;
            const taskDraft: Omit<TaskTypes.Task, 'id'> = {
                dataType: 'task',
                title: eventAsDraft.title || 'Nowe zadanie',
                deadline: eventAsDraft.start || new Date(), // Używamy start jako domyślny deadline
                progress: 'planned',
                category: 'mind',
                details: eventAsDraft.details,
                cyclical: eventAsDraft.cyclical,
            };
            setFormData(taskDraft);
        } else if (TaskTypes.isTask(formData)) {
             // Konwersja na Event Draft
            const taskAsDraft = formData as Omit<TaskTypes.Task, 'id'>;
            const eventDraft: Omit<TaskTypes.Event, 'id'> = {
                dataType: 'event',
                title: taskAsDraft.title || 'Nowe wydarzenie',
                start: taskAsDraft.deadline || new Date(),
                end: new Date(new Date().getTime() + 60 * 60 * 1000), 
                allDay: false,
                details: taskAsDraft.details,
                cyclical: taskAsDraft.cyclical,
            };
            setFormData(eventDraft);
        }
    }

    const handleSave = () => {
        if (formData) {
            // Walidacja:
            if (!formData.title || formData.title.trim() === '') {
                console.error("Błąd: Tytuł jest wymagany.");
                return; 
            }
            
            // Przekazanie ujednoliconego obiektu do rodzica
            props.onSubmit(formData as TaskTypes.EditableItem | TaskTypes.ItemDraft);
            props.onClose(); // Zamykamy po pomyślnym zapisie
        }
    };

    const handleDeleteClick = () => {
        // Sprawdzenie isEditing jest kluczowe i powinno być wystarczające, 
        // ponieważ isModification gwarantuje, że initialData ma 'id'.
        if (isEditing) {
            setConfirmDelete(true); // Otwieramy modal potwierdzenia
        }
    };

    const confirmDeletion = () => {
        // Dodatkowe sprawdzenie, czy initialData ma 'id', pomimo isEditing.
        // Używamy type guard isModification: jeśli initialData jest EditableItem, ma 'id'.
        if (TaskTypes.isModification(props.initialData)) {
            props.onDelete(props.initialData.id);
            props.onClose(); // Zamykamy modal po usunięciu
        } else {
             // To jest backup, gdyby próbowano usunąć draft (co jest niemożliwe przez przycisk Usuń)
             console.error("Nie można usunąć, ponieważ brakuje ID elementu.");
        }
    };

    const renderFormFields = () => {
        if (!formData) return null;

        return (
            <div className="space-y-4">
                {/* 1. Tytuł */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tytuł</label>
                    <input 
                        type="text" 
                        name="title"
                        value={formData.title || ''} 
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Wpisz tytuł..."
                    />
                </div>

                {/* 2. Pole 'Szczegóły' - wspólne dla obu typów */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Szczegóły (opcjonalnie)</label>
                    <textarea 
                        name="details"
                        value={formData.details || ''} 
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        placeholder="Dodaj szczegółowy opis..."
                    />
                </div>


                {/* 3. Przełącznik typu (tylko przy tworzeniu) */}
                {!isEditing && (
                    <div className="flex justify-start items-center p-2 bg-indigo-50 rounded-lg">
                        <span className="text-sm font-medium text-indigo-700 mr-4">Aktualny typ: {itemTypeLabel}</span>
                        <button 
                            onClick={handleTypeSwitch} 
                            className="text-indigo-600 font-semibold text-sm hover:text-indigo-800 transition duration-150"
                        >
                            Przełącz na {!isEventType ? 'Wydarzenie' : 'Zadanie'}
                        </button>
                    </div>
                )}
                
                {/* 4. Pola specyficzne dla Eventu */}
                {isEventType && TaskTypes.isEvent(formData) && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Początek</label>
                            <input
                                type="datetime-local"
                                name="start"
                                value={formatDateInput(formData.start)}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Koniec</label>
                            <input
                                type="datetime-local"
                                name="end"
                                value={formatDateInput(formData.end)}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="flex items-center col-span-2">
                            <input
                                id="allDay"
                                name="allDay"
                                type="checkbox"
                                checked={formData.allDay}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            />
                            <label htmlFor="allDay" className="ml-2 block text-sm text-gray-900">
                                Całodniowe
                            </label>
                        </div>
                    </div>
                )}

                {/* 5. Pola specyficzne dla Tasku */}
                {!isEventType && TaskTypes.isTask(formData) && (
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Deadline (Termin)</label>
                            <input
                                type="datetime-local"
                                name="deadline"
                                value={formatDateInput(formData.deadline)}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                         {/* Progress */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Postęp</label>
                            <select
                                name="progress"
                                value={formData.progress}
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
                            <label className="block text-sm font-medium text-gray-700">Kategoria</label>
                            <select
                                name="category"
                                value={formData.category}
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

                {/* 6. Pole Cykliczne (wspólne) */}
                <div className="flex items-center pt-2">
                    <input
                        id="cyclical"
                        name="cyclical"
                        type="checkbox"
                        checked={formData.cyclical || false}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label htmlFor="cyclical" className="ml-2 block text-sm text-gray-900">
                        Element cykliczny/powtarzalny (TODO: implementacja logiki powtarzania)
                    </label>
                </div>
            </div>
        );
    };
    return(
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 transform transition-all duration-300 scale-100">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-6 border-b pb-3">{itemActionLabel}</h2>
                
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