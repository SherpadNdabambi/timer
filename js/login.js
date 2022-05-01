//get DOM elements
const loginMessage = $('#loginMessage'), password = $('#password'), username = $('#username');

function login(){
    if(username.val() === 'test' && password.val() === '123'){
        localStorage.setItem('username', 'Test User');
        location.href = 'index.html';
    }
    else loginMessage.append('Invalid username and/or password');
}

setFooterYear();