//get DOM elements
const refreshButton = document.querySelector('#refreshButton'),
      startButtonContainer = document.querySelector('#startButtonContainer'),
      stopButtonContainer = document.querySelector('#stopButtonContainer'),
      taskNameDiv = document.querySelector('#taskNameDiv');

//add document click event
$(document).click(event => {
    //hide account panel if it's visible and user clicks outside it
    if(isVisible(accountPanel)){

        //declare local variables
        let mousePosition = {
            x: event.clientX,
            y: event.clientY
        }

        if(!isWithin(accountPanel, mousePosition)) hide(accountPanel);
    }

    //hide task name dialogue if it's visible and user clicks outside it
    /*if(isVisible(taskNameDialogue)){
        //declare local variables
        let mousePosition = {
            x: event.clientX,
            y: event.clientY
        }

        if(!isWithin(taskNameDialogue, mousePosition)) closeTaskNameDialogue();
    }*/
});

//page load function
$(document).ready(async () => {
    initializeGlobalVariables();
    await getSettings();
    initializeTimer();
    displayTimer();
    setFooterYear();
    setSoundIcon();
	setUsername();
    setVolume();
    volumeSlider.val(volume * 100);

    //declare pause timer tick function
    pauseTimer.tick = function(){
        timePaused.addSeconds(1);
        updatePageTitle();
        if(pauseReminder && timePaused.toString() === pauseTimeLimit.times(pauseReminderCount + 1).toString()){
            remind('Your session has been paused for ' + pauseTimeLimit.times(pauseReminderCount + 1).inWords());
            pauseReminderCount++;
        }
        updateSession();
        if(document.activeElement.toString() !== '[object HTMLInputElement]') startButton.focus();
    }

    //declare timer tick function
    timer.tick = () => {
        timeWorked.addSeconds(1);
        if(playTickSound) tickSound.play();
        timerDiv.innerText = timeWorked.toString('MMSS');
        updatePageTitle();
        updateSession();
        if(document.activeElement.toString() !== '[object HTMLInputElement]') pauseButton.focus();
    }
});

function displayButtons(){
    hide(stopButtonContainer);
    show(startButtonContainer);
    startButton.focus();
}

function displayTimer(){
    timerDiv.innerHTML = timeWorked.toString('MMSS');
    updatePageTitle();
}

function initializeGlobalVariables(){
    pauseTimer = new Timer();
    timePaused = new Time();
    timer = new Timer();
    user = JSON.parse(localStorage.user);
    volumeSlider = $('#volumeSlider');
}

function initializeTimer(){
    timeWorked = new Time();
}

function pause(){
    alarmSound.play();
    pauseButton.disabled = 'disabled';
    hide(stopButtonContainer);
    show(startButtonContainer);
    startButton.focus();
    timePaused = new Time();
    timer.stop();
    pauseTimer.start();
}

function start(){
    //check if user is logged in
    checkLogin();

    timer.start();
    if(pauseTimer.isRunning){
        pauseTimer.stop();
        pauseReminderCount = 0;
    }
    alarmSound.play();
    tickSound.play();
    hide(startButtonContainer);
    show(stopButtonContainer);
    pauseButton.removeAttribute('disabled');
    pauseButton.focus();
    if(refreshButton.disabled) refreshButton.removeAttribute('disabled');
    if(timeWorked.toString() === '00:00:00'){
        calculateTimeStarted();
        saveSession();
    }
}

function updatePageTitle(){
    document.title = '[' + timeWorked.toString('MMSS') + '] ' + taskName + ' - Stopwatch Timer';
}

function updateTaskName(){
    taskNameDiv.innerText = taskName = $('#taskName').val();
    closeTaskNameDialogue();
}