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
- [ ] Add a settings menu for additional options
  - [X] Add the menu
    - [ ] Inputs for custom time setting
    - [X] Volume bar
	- [ ] Additional sounds
	- [ ] Browser notification controls
- [ ] Clean up timer logic
- [ ] Don't run audio if user hits stop button
- [X] Pomodoro trademark / copyright
  - [X] Illustrate site is not affiliated with Francesco Cirillo
- [ ] Add current time to the title element
- [ ] Remove reliance on jQuery

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
- [ ] Add todo functionality
  - [ ] Basic ToDo functionality
    - [X] Store todos
      - [X] Lists
      - [X] Tasks
    - [X] Display todos
      - [X] Lists
      - [X] Tasks
    - [X] Add todos
      - [X] Lists
	    - [X] Set active list on add of new list
	  - [X] Tasks
    - [ ] Update todos
      - [ ] Lists
      - [ ] Tasks
    - [ ] Delete todos
      - [ ] Lists
	    - [ ] From lists list 😂
		- [X] Button below selected list
		- [ ] Add confirmation popup
	  - [ ] Tasks
	    - [ ] Add confirmation popup
  - [ ] Track completed todos in one list
    - [ ] Push to list on clear completed
	- [ ] Store completed in local storage
  - [ ] Track number of Pomodoros per todo
  - [ ] Improve styles - UI/UX
    - [ ] Create starter list(s) and tasks as a tutorial
    - [ ] Ways to deal with long list and task names aside from overflow hidden
	  - [ ] Shift to new line?
	- [ ] Side by side w/ timer on Desktop large screens?
	- [ ] Appearance on mobile
	  - [ ] Current design breaking due to some overflows
	  - [ ] Improve element stacking for a cleaner flow
  - [ ] Delete All
    - [ ] Add button to remove all tasks and lists and clear local storage

### Implementations

### Bugs
- [ ] 9/19 - Occasionally, the initial session time does not get set correctly
  - [ ] Find out why that occurs
- [ ] 9/19 - Stoping counter during session still runs break
  - [ ] Should not have a break if you paused your session
- [ ] 9/19 - Stopping counter during break causes break time to disappear and makes reset button appear

### Resolved Bugs
