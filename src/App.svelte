<script lang="ts">
  import { io } from 'socket.io-client'
  import LoginView from './lib/LoginView.svelte'
  const socket = io()

  let text = ''
  let waiting = false
  let currentInput = ''
  let started = false
  let starting_word = ''

  let isLoggedIn = false

  let wrongGuess = false

  let outcomeMessage = ''

  const player = {
    id: Math.random(),
    name: 'Alex',
    rank: 'Noob',
  }

  socket.on('game_started', (data) => {
    waiting = false
    started = true

    starting_word = data.startingWord

    console.log('room data', data)
  })

  const handleInput = () => {
    socket.emit('input', text)
  }

  socket.on('user_input', (text) => {
    currentInput = text
  })

  socket.on('round_end', (data) => {
    // show winning/losing
    outcomeMessage = data.winner.id === player.id ? 'You won!' : 'You lost!'
    // do cleanup
  })

  const joinRoom = () => {
    socket.emit('start_matchmaking', player)

    waiting = true
  }

  socket.on('wrong_guess', (data) => {
    if (data.id !== player.id) {
      return
    }

    wrongGuess = true
    setTimeout(() => {
      wrongGuess = false
    }, 800)
  })

  const handleGuess = () => {
    socket.emit('word_submit', text)
  }
</script>

{#if !isLoggedIn}
  <LoginView />
{/if}

<main class="container mx-auto grid place-content-center h-screen">
  <div class="main-input mb-4">
    <h1>Starting word: {starting_word}</h1>
    <label for="input-1" class="block text-sm">
      Send this to the server in real time
    </label>
    <input
      class="border border-gray-200 block shadow-md p-2"
      type="text"
      bind:value={text}
      placeholder="hello"
      on:input={handleInput}
    />

    <button class="bg-green-400 p-3 shadow-md" on:click={handleGuess}
      >guess</button
    >

    {#if waiting}
      <p class="text-red-500">Waiting for another player to join..</p>
    {/if}

    {#if started}
      <p class="text-green-500">Game started!</p>
    {/if}
  </div>
  <button class="bg-blue-400 p-3 shadow-md" type="button" on:click={joinRoom}
    >Join waiting room..</button
  >

  input is: {currentInput}

  {#if wrongGuess}
    <p class="text-red-500">Wrong guess!</p>
  {/if}

  {#if outcomeMessage}
    <p>{outcomeMessage}</p>
  {/if}
</main>

<style>
</style>
