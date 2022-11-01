//check if user is logged in
checkLogin() && redirect();

//redirect to timer mode
function redirect() {
    if (localStorage.timerMode === 'countdown') location.href = 'countdown.html';
    else
        if (localStorage.timerMode === 'stopwatch') location.href = 'stopwatch.html';
        else location.href = 'pomodoro.html';
}