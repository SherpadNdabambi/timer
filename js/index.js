//check if user is logged in
checkLogin() && redirect();

//redirect to timer mode
function redirect() {
    if (localStorage.getItem('timerMode') === 'countdown') location.href = 'countdown.html';
    else if (localStorage.getItem('timerMode') === 'pomodoro') location.href = 'pomodoro.html';
    else location.href = 'stopwatch.html';
}