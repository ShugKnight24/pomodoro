# Pomodoro Tracker

Pomodoro tracker with timer and todo list built with vanilla JavaScript

More to come...

## Improvements / To-Do

- [ ] Refactor section toggle functionality - don't rely on max-height
  - Breaks when new lists / tasks are added, have to toggle section again to fix. bad experience
- [ ] Improve accessibility
- [ ] Improve UI/UX
  - [ ] further refine mobile responsiveness
    - Go with different layout / functionality
  - [ ] Better styles for Settings menu
    - [ ] Add additional fields
- [ ] Build a tomato with css
- [ ] Add a settings menu for additional options
  - [ ] custom time setting
  - [ ] Additional sounds
  - [ ] Browser notification controls
- [ ] Don't run audio if user hits stop button
- [ ] Add current time to the title element

## Future Ideas

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

  - [ ] Improve ToDo functionality
    - [ ] Delete Lists in list creation form?
    - [ ] Add confirmation popup
    - [ ] Tasks
      - [ ] Add confirmation popup
  - [ ] IUI/UX
    - [ ] Create starter list(s) and tasks as a tutorial
    - [ ] Ways to deal with long list and task names aside from overflow hidden
    - [ ] Shift to new line?
  - [ ] Side by side w/ timer on Desktop large screens?
  - [ ] Appearance on mobile
    - [ ] Current design breaking due to some overflows
    - [ ] Improve element stacking for a cleaner flow
  - [ ] Delete All
    - [ ] Add button to remove all tasks and lists and clear local storage

---

## Implementations

## Bugs

## Resolved Bugs

- Stopping counter during break works correctly
- Stopping counter during session does not run the break
- Initial session time is now properly set
