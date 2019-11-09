# Pomodoro Timer
Basic Pomodoro timer built with jQuery

Currently refactoring... Will likely create a React version in the future

### Improvements / To-Do:
- [ ] Improve UI - *Cringe* 😬
  - [X] Fix mobile responsiveness - *Cringe Intensifies*
  - [X] Moved description to accordion
  - [X] Add accordion for how to use Pomodoro
  - [X] Add accordion for additional info
  - [ ] Better styles for Setting menu
    - [ ] Add all needed fields
  - [ ] Animations / etc...
- [ ] Build a tomato with css
- [ ] Add a settings modal for additional options
  - [X] Add modal
    - [ ] Inputs for custom time setting
    - [ ] Volume bar
	- [ ] Additional sounds
- [ ] Clean up timer logic
- [ ] Don't run audio if user hits stop button
- [X] Pomodoro trademark / copyright
  - [X] Illustrate site is not affiliated with Francesco Cirillo

### Future Ideas
- [ ] Allow user to turn on ticking / metronome noise per second
  - [ ] Different sounds...
  - [ ] Allow users to set their own via YouTube
- [ ] Animate an actual timer ticking
  - [ ] Kitchen timer
  - [ ] Tomato timer
- [ ] Access browser notifications...?
  - [ ] Informational modal if no notifications
    - [ ] Image illustrating notification reset
- [ ] Add user accounts
  - [ ] Authentication
  - [ ] Store user progress
    - [ ] Daily Pomodoros hit
      - [ ] Average
    - [ ] Daily, weekly, monthly, etc...
  - [ ] Task tracking / BasicTask Management
    - [ ] Progress over time (i.e. number of Pomodoros invested)

### Implementations

### Bugs
- [ ] 9/19 - Occasionally, the initial session time does not get set correctly
  - [ ] Find out why that occurs
- [ ] 9/19 - Stoping counter during session still runs break
  - [ ] Should not have a break if you paused your session
- [ ] 9/19 - Stopping counter during break causes break time to disappear and makes reset button appear

### Resolved Bugs
