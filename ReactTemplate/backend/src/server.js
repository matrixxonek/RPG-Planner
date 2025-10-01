const express = require('express');
const cors = require('cors');
const { readTasks, writeTasks } = require('./dataHandler');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

//Trasy API

app.get('/api/tasks', (req,res)=>{
    const tasks = readTasks();
    res.json(tasks);
});

app.post('/api/tasks', (req,res)=>{
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

app.put('/api/tasks/:id', (req,res)=>{
    const taskId = req.params.id;
    const updatedTaskData = req.body;
    let tasks = readTasks();

    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if(taskIndex !== -1){
        tasks[taskIndex] = { 
            ...tasks[taskIndex], // Zachowaj stare dane (jak np. ID)
            ...updatedTaskData,  // Nadpisz nowymi danymi
            id: taskId           // Upewnij się, że ID jest poprawne
        };
        writeTasks(tasks);
        res.json(tasks[taskIndex]);
    }else{
        res.status(404).send({ message: 'Zadanie nie znalezione.' });
    }
});

app.delete('/api/tasks/:id', (req,res)=>{
    const taskId = req.params.id;
    let tasks = readTasks();

    const initialLength = tasks.length;
    tasks = tasks.filter(t => t.id !== taskId);

    if (tasks.length < initialLength) {
        writeTasks(tasks);
        // Zwykle status 204 No Content jest używany dla pomyślnego usunięcia
        res.status(204).send(); 
    } else {
        res.status(404).send({ message: 'Zadanie nie znalezione.' });
    }
});

app.listen(PORT, () => {
    console.log(`Serwer API działa na porcie http://localhost:${PORT}`);
});