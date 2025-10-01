const express = require('express');
const cors = require('cors');
const { readEvents, writeEvents } = require('./dataHandler');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

//Trasy API

app.get('/api/events', (req,res)=>{
    const events = readEvents();
    res.json(events);
});

app.post('/api/events', (req,res)=>{
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

app.put('/api/events/:id', (req,res)=>{
    const eventId = req.params.id;
    const updatedEventData = req.body;
    let events = readEvents();

    const eventIndex = events.findIndex(t => t.id === eventId);

    if(eventIndex !== -1){
        events[eventIndex] = { 
            ...events[eventIndex], // Zachowaj stare dane (jak np. ID)
            ...updatedEventData,  // Nadpisz nowymi danymi
            id: eventId           // Upewnij się, że ID jest poprawne
        };
        writeEvents(events);
        res.json(events[eventIndex]);
    }else{
        res.status(404).send({ message: 'Zadanie nie znalezione.' });
    }
});

app.delete('/api/events/:id', (req,res)=>{
    const eventId = req.params.id;
    let events = readEvents();

    const initialLength = events.length;
    events = events.filter(t => t.id !== eventId);

    if (events.length < initialLength) {
        writeEvents(events);
        // Zwykle status 204 No Content jest używany dla pomyślnego usunięcia
        res.status(204).send(); 
    } else {
        res.status(404).send({ message: 'Zadanie nie znalezione.' });
    }
});

app.listen(PORT, () => {
    console.log(`Serwer API działa na porcie http://localhost:${PORT}`);
});