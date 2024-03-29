import { app, server, io } from './server.js'
import { content } from './words.js'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use('/', express.static(path.join(__dirname, '..', 'dist')))

// waiting players and rooms
const MAX_PLAYERS = 2
const waitingPlayers = []

const rooms = []

io.on('connection', (socket) => {
  let currentRoom = null
  let currentPlayer = null

  console.log('a user connected')

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })

  socket.on('input', (text) => {
    socket.emit('user_input', text)
  })

  socket.on('start_matchmaking', (player) => {
    // everytime a player joins the waiting room
    // we add the player to the waitingPlayers array
    waitingPlayers.push(player)
    // assign the current player
    currentPlayer = player

    console.log('cURRENT PLAYER', player)

    // create room if waiting players isn't divisible by 2
    if (waitingPlayers.length % MAX_PLAYERS !== 0) {
      const currentRoomId = rooms.length + 1

      const room = {
        id: currentRoomId,
        players: [player],
        status: 'waiting'
      }

      rooms.push(room)

      socket.join(currentRoomId)
      currentRoom = room

      return
    }

    // find a suitable room
    const suitableRoom = rooms.find(room => room.players.length < MAX_PLAYERS)
    // take random word from the content array
    const startingWord = content[Math.floor(Math.random() * content.length)]

    suitableRoom.players.push(player)
    suitableRoom.status = 'started'
    suitableRoom.startingWord = startingWord

    currentRoom = suitableRoom

    socket.join(suitableRoom.id)

    io.to(suitableRoom.id).emit('game_started', suitableRoom)
  })

  // word_submit event, when a player types a word in and presses enter
  socket.on('word_submit', (guess) => {
    if (!currentRoom) {
      return
    }

    // get the timestamp of the guess
    const timestamp = Date.now()

    const currentGuess = {
      text: guess,
      timestamp: timestamp,
      player: currentPlayer
    }

    currentRoom.currentGuesses = currentRoom.currentGuesses || []

    currentRoom.currentGuesses.push(currentGuess)

    validateGuesses()

    console.log('in room', currentRoom)
    console.log('a guess has been made', guess)
  })

  function validateGuesses() {
    console.log('VALIDATION')
    let guesses = currentRoom.currentGuesses

    if (!guesses) {
      return
    }

    let correctGuesses = []

    // take the starting word
    const startingWord = currentRoom.startingWord
    // take the last letter of the starting word
    const lastLetter = startingWord[startingWord.length - 1]
    // take all the words from content array that start with last letter
    const possibleWords = content.filter(word => word.startsWith(lastLetter))

    for (const guess of guesses) {
      // check if guess is part of possible words
      const isCorrect = possibleWords.includes(guess.text)
      isCorrect ? correctGuesses.push(guess) : false
    }

    if (!correctGuesses.length) {
      io.to(currentRoom.id).emit('wrong_guess', currentPlayer)

      return
    }

    let winningGuess = null

    if (correctGuesses.length > 1) {
      console.log('CORRECT GUESSES')

      console.log('NOW PLAYER', currentPlayer, currentPlayer.id)

      // take the quickest one based on the timestamp (there are only two guesses)
      winningGuess = correctGuesses.sort((a, b) => a.timestamp - b.timestamp)[0]

      console.log('WINNING GUESS IS', winningGuess, currentPlayer)
    } else {
      winningGuess = correctGuesses[0]
    }

    io.to(currentRoom.id).emit('round_end', {
      winner: winningGuess.player,
      word: winningGuess.text
    })
  }
})

server.listen(3000, () => {
  console.log('server running at http://localhost:3000')

  console.log('words', content)
})