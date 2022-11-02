//get DOM elements
const phaseLabel = document.querySelector("#phaseLabel");

//declare global variables
let breakIteration,
	extraTimeWorked = new Time(),
	phase,
	timeLeft,
	workIteration;

//add document click event
$(document).click(event => {

	//hide context menu if it's visible and user clicks outside it
	if(isVisible(contextMenu)) hide(contextMenu);

	//hide account panel if it's visible and user clicks outside it
	if(isVisible(accountPanel)){

		//declare local variables
		let mousePosition = {
			x: event.clientX,
			y: event.clientY
		}

		if(!isWithin(accountPanel, mousePosition)) hide(accountPanel);
	}
});

//page load function
$(document).ready(async () => {
	addContextMenu();
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
	pauseTimer.tick = () => {
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
		if(/Work/.test(phase)){
			timeWorked.addSeconds(1);
			if(playTickSound) tickSound.play();
			if(phase === "Extra Work Time"){
				extraTimeWorked.addSeconds(1);
				timerDiv.innerHTML = extraTimeWorked.toString("MMSS");
			}
			else{
				timeLeft.addSeconds(-1);
				timerDiv.innerHTML = timeLeft.toString("MMSS");
				if(breakReminder && timeLeft.toString() === breakReminderTime.toString()){
					if(workIteration < 4) remind("Short break will start in " + timeLeft.inWords());
					else remind("Long break will start in " + timeLeft.inWords());
				}
				if(timeLeft.toString() === "00:00:00") initiateNextPhase();
			}
		}
		else{
			timeLeft.addSeconds(-1);
			timerDiv.innerHTML = timeLeft.toString("MMSS");
			if(timeLeft.toString() === "00:00:00") initiateNextPhase();
		}
		updatePageTitle();
		updateSession();
		if(document.activeElement.toString() !== "[object HTMLInputElement]") pauseButton.focus();
	}
});

function displayButtons(){
	hide(pauseButton);
	hide(stopButton);
	show(startButton);
	startButton.focus();
}

function displayTimer(){
	timerDiv.innerHTML = timeLeft.toString("MMSS");
	phaseLabel.innerHTML = phase;
	updatePageTitle();
}

function initializeTimer(){
	breakIteration = 1;
	workIteration = 1;
	phase = "Work (1/4)";
	timeLeft = new Time(workTime.toString());
	timeWorked = new Time();
}

function initializeGlobalVariables(){
	pauseTimer = new Timer();
	timePaused = new Time();
	timer = new Timer();
	user = JSON.parse(localStorage.user);
	volumeSlider = $('#volumeSlider');
}

function initiateNextPhase(){
	timer.stop();
	alarmSound.play();
	if(/Work/.test(phase)){
		if(workIteration < 4){
			phase = "Short Break (" + breakIteration + "/3)";
			phaseLabel.innerHTML = phase;
			timeLeft = new Time(shortBreakTime.toString());
			workIteration++;
		}
		else{
			if(confirm("Your session is complete. Do you wish to continue working?")){
				phase = "Extra Work Time";
				phaseLabel.innerHTML = phase;
				workIteration++;
			}
			else{
				phase = "Long Break";
				phaseLabel.innerHTML = phase;
				timeLeft = new Time(longBreakTime.toString());
			}
		}
		timer.start();
	}
	else{
		if(breakIteration < 4){
			phase = "Work (" + workIteration + "/4)";
			phaseLabel.innerHTML = phase;
			timeLeft = new Time(workTime.toString());
			timer.start();
			breakIteration++;
		}
		else endSession();
	}
}

function jumpToReminder(){
	let jumpTime = new Time(breakReminderTime.toString());
	jumpTime.addSeconds(1);
	timeLeft = jumpTime;
	timerDiv.innerHTML = timeLeft.toString("MMSS");
}

function pause(){
	alarmSound.play();
	hide(pauseButton);
	show(startButton);
	startButton.focus();
	timePaused = new Time();
	timer.stop();
	pauseTimer.start();
}

function skipPhase(){
	timeLeft = new Time("0:0:1");
}

function start(){
	//check if user is logged in
	if(checkLogin()) {
		timer.start();
		if (pauseTimer.isRunning) {
			pauseTimer.stop();
			pauseReminderCount = 0;
		}
		alarmSound.play();
		tickSound.play();
		hide(startButton);
		show(pauseButton, stopButton);
		pauseButton.focus();
		if (timeWorked.toString() === "00:00:00") {
			calculateTimeStarted();
			createSession();
		}
	}
}

function updatePageTitle(){
	document.title = "[" + timeLeft.toString("MMSS") + "] " + taskName + " - Pomodoro Timer";
}

function updateTaskName(){
	taskName = $("#taskName").val();
}