# 🎯 Guess the Answer

A real-time multiplayer quiz game built with Node.js, Express, and Socket.io, where players compete by answering questions, earning points, and dynamically taking control of the game as the "Master".

## Overview

This is a real-time, session-based multiplayer game designed for 3 or more players.

Players join a shared game session where one player acts as the **Master**, setting questions for others to answer. The first player to answer correctly:

- Earns **10 points**
- Becomes the **new Master**
- Controls the next round

The game uses WebSockets (Socket.io) for instant communication between players, creating a continuous loop of competition, interaction, and control.

## How It Works

1. A player creates a session and becomes the Master
2. They share the **session code** with friends
3. Friends join by entering the code on the home page
4. Once 3+ players are in the session, the Master sets a question
5. Other players race to submit the correct answer
6. The first correct answer wins the round, earns points, and becomes the new Master
7. The cycle continues until the session creator ends it

## Core Features

- **Real-Time Gameplay** — Powered by Socket.io with instant updates across all players
- **Session Rooms** — Isolated gameplay per session, supports multiple concurrent sessions
- **Dynamic Master Role** — The round winner becomes the next Master
- **Timer-Based Rounds** — Each round has a countdown to keep things competitive
- **Live Chat** — In-game chat running alongside gameplay
- **Session Scoring** — Points tracked per session with live rankings
- **Leave Session** — Any player can leave the session at any time
- **End Session** — Only the original session creator can end the session for all players

## Architecture

```
Client (HTML/CSS/JS)  ←—Socket.io—→  Server (Node.js + Express)
                                          ↓
                                     Game State (in-memory)
```

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js, Express.js, Socket.io

### Key Design Decisions

- **Event-Driven Communication** — All game actions flow through Socket.io events
- **Room-Based Isolation** — Each session operates independently
- **State Synchronization** — All players see the same game state in real time
- **Graceful Reconnection** — Players can reconnect without losing their place

## Project Structure

```
Guessing-Game/
├── public/                # Frontend
│   ├── index.html         # Landing page
│   ├── session.html       # Game session page
│   ├── css/session.css    # Session styles
│   └── js/
│       ├── index.js       # Landing page logic
│       └── session.js     # Session logic
├── socketHandler.js       # Game logic & socket events
├── app.js                 # Server entry point
└── package.json
```

## Getting Started

### Prerequisites

- Node.js installed

### Installation

```bash
git clone https://github.com/HajayB/Guessing-game.git
cd Guessing-game
npm install
```

### Environment Variables (optional)

Create a `.env` file in the root:

```
PORT=4000
```

### Run the App

```bash
npm start
```

Open your browser at **http://localhost:4000**

### Requirements

- Minimum of **3 players** to start a round
- Stable internet connection for real-time interaction

## Author

**Basit Adeola Ajayi**
GitHub: [HajayB](https://github.com/HajayB)
