const fs = require('fs');
const path = require('path');

// Definicja oddzielnych ścieżek dla Tasków i Eventów
const EVENTS_FILE = path.join(__dirname, 'events.json');
const TASKS_FILE = path.join(__dirname, 'tasks.json');

/**
 * Ogólna funkcja do bezpiecznego odczytu dowolnego pliku JSON.
 * @param {string} filePath Ścieżka do pliku (EVENTS_FILE lub TASKS_FILE)
 * @param {string} fileName Nazwa pliku dla komunikatów błędu
 */
const readData = (filePath, fileName) => {
    try {
        // Czyta dane synchronicznie
        const data = fs.readFileSync(filePath, 'utf8');
        // Zwraca sparsowane dane lub pustą tablicę, jeśli plik jest pusty
        return JSON.parse(data || '[]');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`Plik ${fileName} nie istnieje, tworzę pustą listę.`);
            return [];
        }
        console.error(`Błąd odczytu danych z ${fileName}:`, error);
        return [];
    }
};

/**
 * Ogólna funkcja do bezpiecznego zapisu danych do dowolnego pliku JSON.
 * @param {Array<any>} data Dane do zapisania
 * @param {string} filePath Ścieżka do pliku
 * @param {string} fileName Nazwa pliku dla komunikatów błędu
 */
const writeData = (data, filePath, fileName) => {
    try {
        const jsonContent = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, jsonContent, 'utf8');
    } catch (error) {
        console.error(`Błąd zapisu danych do ${fileName}:`, error);
    }
};

// --- Funkcje eksportowane dla Eventów ---
const readEvents = () => readData(EVENTS_FILE, 'events.json');
const writeEvents = (events) => writeData(events, EVENTS_FILE, 'events.json');

// --- Funkcje eksportowane dla Tasków ---
const readTasks = () => readData(TASKS_FILE, 'tasks.json');
const writeTasks = (tasks) => writeData(tasks, TASKS_FILE, 'tasks.json');

module.exports = {
    readEvents,
    writeEvents,
    readTasks, // NOWY
    writeTasks // NOWY
};
