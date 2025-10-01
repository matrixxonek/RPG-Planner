const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, 'events.json');

function readEvents(){
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(data || '[]');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log("Plik events.json nie istnieje, tworzę pustą listę.");
            return [];
        }
        console.error("Błąd odczytu danych:", error);
        return [];
    }
}

function writeEvents(events){
    try {
        const data = JSON.stringify(events, null, 2);
        fs.writeFileSync(DATA_FILE, data, 'utf8');
    } catch (error) {
        console.error("Błąd zapisu danych:", error);
    }
}

module.exports = {
    readEvents,
    writeEvents
};