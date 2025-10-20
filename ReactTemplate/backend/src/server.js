const express = require('express');
const cors = require('cors');
// ZMIANA: Importujemy nowe funkcje dla Tasków
const { readEvents, writeEvents, readTasks, writeTasks } = require('./dataHandler');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// =========================================================================
// TRASY DLA EVENTÓW (/api/events)
// =========================================================================

// GET wszystkich Eventów
app.get('/api/events', (req, res) => {
    const events = readEvents();
    res.json(events);
});

// POST nowego Eventu
app.post('/api/events', (req, res) => {
    const newEvent = req.body;
    const events = readEvents();

    const eventWithId = {
        id: uuidv4(),
        ...newEvent
    };

    events.push(eventWithId);
    writeEvents(events);

    res.status(201).json(eventWithId);
});

// PUT (Aktualizacja) Eventu
app.put('/api/events/:id', (req, res) => {
    const eventId = req.params.id;
    const updatedEventData = req.body;
    let events = readEvents();

    const eventIndex = events.findIndex(e => e.id === eventId);

    if (eventIndex !== -1) {
        events[eventIndex] = {
            ...events[eventIndex],
            ...updatedEventData,
            id: eventId // Upewnij się, że ID jest poprawne
        };
        writeEvents(events);
        res.json(events[eventIndex]);
    } else {
        res.status(404).send({ message: 'Wydarzenie nie znalezione.' });
    }
});

// DELETE Eventu
app.delete('/api/events/:id', (req, res) => {
    const eventId = req.params.id;
    let events = readEvents();

    const initialLength = events.length;
    events = events.filter(e => e.id !== eventId);

    if (events.length < initialLength) {
        writeEvents(events);
        res.status(204).send();
    } else {
        res.status(404).send({ message: 'Wydarzenie nie znalezione.' });
    }
});

// =========================================================================
// TRASY DLA TASKÓW (/api/tasks) - NOWE
// =========================================================================

// GET wszystkich Tasków
app.get('/api/tasks', (req, res) => {
    const tasks = readTasks();
    res.json(tasks);
});

// POST nowego Taska
app.post('/api/tasks', (req, res) => {
    const newTask = req.body;
    const tasks = readTasks();

    const taskWithId = {
        id: uuidv4(),
        ...newTask
    };

    tasks.push(taskWithId);
    writeTasks(tasks);

    res.status(201).json(taskWithId);
});

// PUT (Aktualizacja) Taska
app.put('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const updatedTaskData = req.body;
    let tasks = readTasks();

    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex !== -1) {
        tasks[taskIndex] = {
            ...tasks[taskIndex],
            ...updatedTaskData,
            id: taskId
        };
        writeTasks(tasks);
        res.json(tasks[taskIndex]);
    } else {
        res.status(404).send({ message: 'Zadanie nie znalezione.' });
    }
});

// DELETE Taska
app.delete('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    let tasks = readTasks();

    const initialLength = tasks.length;
    tasks = tasks.filter(t => t.id !== taskId);

    if (tasks.length < initialLength) {
        writeTasks(tasks);
        res.status(204).send();
    } else {
        res.status(404).send({ message: 'Zadanie nie znalezione.' });
    }
});


app.listen(PORT, () => {
    console.log(`Serwer API działa na porcie http://localhost:${PORT}`);
});
