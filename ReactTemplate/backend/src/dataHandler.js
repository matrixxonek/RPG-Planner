const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, 'tasks.json');

function readTasks(){
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(data || '[]');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log("Plik tasks.json nie istnieje, tworzę pustą listę.");
            return [];
        }
        console.error("Błąd odczytu danych:", error);
        return [];
    }
}

function writeTasks(tasks){
    try {
        const data = JSON.stringify(tasks, null, 2);
        fs.writeFileSync(DATA_FILE, data, 'utf8');
    } catch (error) {
        console.error("Błąd zapisu danych:", error);
    }
}

module.exports = {
    readTasks,
    writeTasks
};