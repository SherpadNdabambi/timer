//declare DOM elements
const accountPanel = document.querySelector('#accountPanel'), breakReminderTimeSpan = document.querySelector('#breakReminderTimeSpan'), contextMenu  = document.querySelector('#contextMenu'), pauseButton = document.querySelector('#pauseButton'), soundIcon = document.querySelector('#soundIcon'), startButton = document.querySelector('#startButton'), stopButton = document.querySelector('#stopButton'), taskNameDialogue = document.querySelector('#taskNameDialogue'), timerDiv = document.querySelector('#timerDiv');
let volumeSlider;

//declare global variables
let alarmSound = new Audio('sounds/alarm-sound.wav'), dateStarted, dateStopped, pauseReminderCount = 0, pauseTimer, sessions, taskName = 'Unnamed task', tickSound = new Audio('sounds/tick-sound.wav'), timePaused, timer, timeStarted, timeStopped, timeWorked;

//declare setting variables
let breakReminder, breakReminderTime, longBreakTime, pauseReminder, pauseTimeLimit, playTickSound, settings, shortBreakTime, timerMode, volume, workTime;

//add context menu
function addContextMenu(){
	  document.addEventListener('contextmenu', event => {
          breakReminderTimeSpan.innerHTML = breakReminderTime.toString('MMSS');
          show(contextMenu);
          event.preventDefault();
          contextMenu.style.setProperty('--mouse-x', event.clientX + 'px');
          contextMenu.style.setProperty('--mouse-y', event.clientY + 'px');
          }, false);
}

function calculateTimeStarted(){
    let dateTime = currentDateTime();
    dateStarted = dateTime.date;
    timeStarted = dateTime.time;
}

function calculateTimeStopped(){
    let dateTime = currentDateTime();
    dateStopped = dateTime.date;
    timeStopped = dateTime.time;
}

function checkLogin(){
    if(localStorage.getItem('username')) return true;
    location.href = 'login.html';
}

function closeTaskNameDialogue(){
    taskNameDialogue.style.display = 'none';
}

function currentDateTime(){
    let date = new Date, time = new Time(date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds());

    return {
        'date': date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate(),
        'time': time.toString()
    }
}

function endSession(){
    timer.stop();
    updateSession();
    initializeTimer();
    displayTimer();
    displayButtons();
}

function getSettingVariables(){
    //get settings from local storage
    settings = JSON.parse(localStorage.getItem('settings'));
    
    //assign settings to setting variables
    breakReminder = settings.break_reminder;
    breakReminderTime = new Time(settings.break_reminder_time);
    longBreakTime = new Time(settings.long_break_time);
    pauseReminder = settings.pause_reminder;
    pauseTimeLimit = new Time(settings.pause_time_limit);
    playTickSound = settings.play_tick_sound;
    shortBreakTime = new Time(settings.short_break_time);
    timerMode = settings.timer_mode;
    volume = settings.volume / 100;
    workTime = new Time(settings.work_time);
}

function hide(){
    for(let i = 0; i < arguments.length; i++) arguments[i].setAttribute('class', (arguments[i].getAttribute('class') === '') ? 'hidden' : arguments[i].getAttribute('class') + ' hidden');
}

function isWithin(element, mousePosition){
    return (element.offsetLeft < mousePosition.x) && (mousePosition.x < (element.offsetLeft + element.offsetWidth)) && (element.offsetTop < mousePosition.y) && (mousePosition.y < (element.offsetTop + element.offsetHeight))
}

function isVisible(element){
    if(element.classList) return !element.classList.contains('hidden');
    else return element.style.display !== "none";
}

function logout(){
    if(timeWorked.toString() === '00:00:00' || confirm('Are you sure you want to logout? Your current session will be saved.')){
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

function muteButtonClicked(){
    if(volume === 0){
        volume = volumeSlider.val() / 100;
        volumeSlider.disabled = false;
    }
    else{
        volume = 0;
        volumeSlider.disabled = true;
    }
    setSoundIcon();
    setVolume();
}

function remind(message){
    let speech = new SpeechSynthesisUtterance(message);
    speech.rate = 0.9;
    speech.volume = volume;
    speechSynthesis.speak(speech);
    alert(message);
}

function saveSession(){
    calculateTimeStopped();
    if(localStorage.getItem('sessions'))
        localStorage.setItem('sessions',
            localStorage.getItem('sessions') + ';' +
            JSON.stringify(
                {
                    date_started: dateStarted,
                    date_stopped: dateStopped,
                    task_name: taskName,
                    time_started: timeStarted,
                    time_stopped: timeStopped,
                    time_worked: timeWorked,
                    timer_mode: timerMode
                }));
    else localStorage.setItem('sessions',
        JSON.stringify(
            {
                date_started: dateStarted,
                date_stopped: dateStopped,
                task_name: taskName,
                time_started: timeStarted,
                time_stopped: timeStopped,
                time_worked: timeWorked,
                timer_mode: timerMode
            }));
}

function setSoundIcon(){
    if(volumeSlider.val() === 0) soundIcon.src = 'img/icons8-mute-50.png';
    else soundIcon.src = 'img/icons8-audio-50.png';
}

function setTimerMode(mode){
    if((timeWorked.toString() === '00:00:00') || confirm(`Switch to ${mode} mode? Your current session will be saved.`)){
        localStorage.setItem('timerMode', mode);
        location.href = 'index.html';
    }
}

function setVolume(){
    alarmSound.volume = volume;
    tickSound.volume = volume;
    settings.volume = volume * 100;
    localStorage.setItem('settings', JSON.stringify(settings));
}

function setFooterYear(){
    let date = new Date(), year = date.getFullYear();
    $('#footerYear').text(year.toString());
}

function show(){
    for(let i = 0; i < arguments.length; i++) arguments[i].setAttribute('class', arguments[i].getAttribute('class').replace(' hidden', '')) || arguments[i].setAttribute('class', arguments[i].getAttribute('class').replace('hidden', ''));
}

function showTaskNameDialogue(){
    taskNameDialogue.style.display = 'flex';
}

function stop(){
    if(confirm('Are you sure you want to end this session?')){
        if(timer.isRunning) timer.stop();
        else pauseTimer.stop();
        alarmSound.play();
        endSession();
    }
}

function updateSession(){
    //declare local variables
    let currentSession, sessionsString;
    
    calculateTimeStopped();
    
    sessionsString = localStorage.getItem('sessions');
    sessions = sessionsString.split(';');
    
    currentSession = JSON.parse(sessions[sessions.length - 1]);
    currentSession.date_stopped = dateStopped.toString();
    currentSession.task_name = taskName.toString();
    currentSession.time_stopped = timeStopped.toString();
    currentSession.time_worked = timeWorked.toString();
    
    //update sessions
    sessionsString = sessionsString.replace(sessions[sessions.length - 1], JSON.stringify(currentSession));
    sessions[sessions.length - 1] = JSON.stringify(currentSession);
    localStorage.setItem('sessions', sessionsString);
}

function volumeSliderChanged(){
    volume = volumeSlider.val() / 100;
    setVolume();
}

//save settings to local storage if they don't exist
if(!localStorage.getItem('settings'))
    localStorage.setItem('settings', JSON.stringify(
        {
            break_reminder: true,
            break_reminder_time: '0:01:30',
            long_break_time: '0:20:00',
            pause_reminder: true,
            pause_time_limit: '0:02:00',
            play_tick_sound: true,
            short_break_time: '0:05:00',
            volume: 4,
            work_time: '0:25:00'
        }));