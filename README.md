# ⚔️ LifeLevel: The Gamified Life Planner

**LifeLevel** is more than just a task manager; it's a productivity RPG where completing your real-life to-do list levels up your in-game character. Turn your daily chores, workouts, and learning sessions into quests that build your attributes and earn you rewards.

## ✨ Features

### 1. The Core Planner

* **Task Management:** Create, organize, and track your daily, weekly, and long-term tasks with detailed descriptions and deadlines.
* **Calendar View:** A unified view to see your **Tasks** (actionable items) alongside **Events** (time blocks/appointments).
* **Task Categorization:** Every task must be assigned to a specific **Thematic Area** to determine its impact on your character.
* **Recurring Tasks:** Set up habits and recurring items to build consistency and earn long-term rewards.

### 2. Gamification (The RPG Element)

The heart of LifeLevel lies in its gamified progression system:

#### **Character & Attributes**

Your Avatar's attributes reflect your dedication and growth in real life:

| Attribute | Thematic Area | Real-Life Impact |
| :--- | :--- | :--- |
| **Intelligence (INT)** | Study, Career, Learning | Increased proficiency in mental tasks. |
| **Strength (STR)** | Fitness, Health, Physical Activity | Increased health and fitness dedication. |
| **Charisma (CHA)** | Social, Daily Life, Networking | Improved social skills and well-being. |
| **Endurance (END)** | Consistency, Recurring Tasks | Represents dedication and habit maintenance. |

#### **The Leveling Mechanic**

1.  **EXP Gain:** Completing a **Task** grants **Experience Points (EXP)** and **Gold**.
2.  **Attribute Growth:** The EXP is automatically directed to the corresponding **Attribute Pool** based on the Task's **Thematic Area**. (e.g., a "Gym Workout" task boosts the **Strength** pool).
3.  **Level Up:** Fill an Attribute Pool to increase the Attribute's Level (e.g., Strength Lvl 5 -> Lvl 6).
4.  **Consequences:** Failing to complete high-priority or recurring tasks on time may result in a loss of **Endurance** or other minor penalties.

#### **Currency & Rewards**

* **Gold:** Earned by completing tasks.
* **User-Defined Reward Shop:** Spend Gold on rewards you define for yourself (e.g., "Buy a new book," "Watch a movie," "Take a day off"). This links in-game success to real-life self-care.
* **Achievements:** Unlock badges and bonuses for reaching milestones (e.g., "Scholar - Reach INT Lvl 10").

🚀 Project Setup and Running Locally (might change in development process)

To get the LifeLevel application running on your local machine, you need to set up both the Node.js API server (backend) and the React application (frontend).

Prerequisites

Node.js (LTS version recommended)

npm or Yarn

1. Cloning and Installation

Start by cloning the repository and installing all necessary dependencies:

git clone <YOUR_REPOSITORY_URL>
cd lifelevel-planner # (Adjust to your main directory name)
npm install
or
yarn install


2. Prepare Data Files

The backend uses local JSON files for persistent data storage. Ensure these two files are present in your project's root directory and contain an empty array:

events.json

tasks.json

You can quickly create them via terminal:

echo "[]" > events.json
echo "[]" > tasks.json


3. Launch the API Server (Backend)

The Express.js server handles all CRUD operations and data synchronization. Launch it in your first terminal window:

node server.js
The console should confirm: Server API running at http://localhost:3001


4. Launch the Client Application (Frontend)

Open a second terminal window and start the React development server:

npm run start
or
yarn start

The application will open in your browser, typically at http://localhost:3000.
