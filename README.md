                                         Real-Time Multiplayer Guessing Game

A real-time multiplayer quiz game built with Node.js, Express, and Socket.io, where players compete by answering questions, earning points, and dynamically taking control of the game as the “Master”.

                                          Overview

This is a real-time, session-based multiplayer game designed for 3 or more players.

Players join a shared game session where one player acts as the Master, setting questions for others to answer. The first player to answer correctly:

Earns points
Becomes the new Master
Controls the next round

The game uses WebSockets (Socket.io) to enable instant communication between players, including answers, chat messages, and game state updates.
The game creates a continuous loop of competition, interaction, and control between players.

                                        Architecture Overview

The application follows a client-server architecture enhanced with real-time communication using WebSockets.

The frontend (HTML, CSS, Vanilla JS) acts as the client, handling user input, rendering the UI, and communicating with the server.
The backend (Node.js + Express) manages game logic, player sessions, scoring, and role assignment.
Socket.io (WebSockets) is used to maintain persistent connections between the server and multiple clients, enabling real-time updates.
    🔄 Data Flow
Clients connect to the server via Socket.io
Players join a specific game session (room)
Game events (questions, answers, chat messages) are emitted from clients
The server processes these events and updates the game state
Updates are broadcast instantly to all players in the session
    ⚙️ Key Design Considerations
State Synchronization: Ensures all players see the same game state in real time
Room-Based Isolation: Each game session operates independently
Event-Driven Communication: Game actions are handled through Socket.io events
Scalability: Designed to support multiple concurrent game sessions



                                          Core Features
    🔌 Real-Time Gameplay (WebSockets)
Powered by Socket.io
Instant updates across all connected players
Real-time answer submission and validation
Live game state synchronization
    👥 Game Sessions / Rooms
Players join specific game sessions
Isolated gameplay per room
Supports multiple concurrent sessions
    👑 Dynamic Role System
One player acts as the Master
Master sets the question
First correct answer:
earns 10 points
becomes the new Master
      ⏱️ Timer-Based Rounds
Each round has a time limit
Encourages fast thinking and competition
Automatically progresses gameplay
      💬 Live Chat System
Players can send messages in real-time
Enhances interaction and engagement
Runs alongside gameplay
      🏆 Scoring System
Players earn points for correct answers
Score tracking across the session
Competitive ranking within the game
      🌐 Deployment
Application is deployed and accessible online
Supports real-time multiplayer across devices

                                          How It Works
A player starts as the Master
Shares the session code to their friends
Friends join and when they are 3 or more in the session 
The Master sets a question
Other players submit their answers
The first player to answer correctly:
Gains 10 points
Becomes the new Master
The new Master sets the next question
The cycle continues.

                                          Objective
Answer questions correctly
Earn points
Become the Master
Finish with the highest score


                                          Tech Stack
    Backend
Node.js
Express.js
Socket.io (WebSockets)
    Frontend
HTML
CSS
Vanilla JavaScript




                                          Project Structure
Guessing-Game/
├── public/            # Frontend (HTML, CSS, JS)
├──socketHandler.js    #Game Logic
├── app.js             # Server entry point
└── package.json


                                            Getting Started
    Prerequisites
Node.js installed
    Installation
git clone https://github.com/HajayB/Guessing-game.git
cd Guessing-game
npm install

    Run the App
npm start
    Access the Game
Open your browser:
http://localhost:3000


    Requirements
Minimum of 3 players
Stable internet connection for real-time interaction
                                          What This Project Demonstrates
Real-time communication using WebSockets (Socket.io)
Managing shared state across multiple clients
Designing multiplayer game logic
Handling concurrency in user interactions
Building session-based applications
Integrating chat with live gameplay


Author
Basit Adeola Ajayi
GitHub: https://github.com/HajayB
