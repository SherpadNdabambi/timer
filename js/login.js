//get DOM elements
const email = $('#email'),
      loginMessage = $('#loginMessage'),
      password = $('#password');

//declare global variables
let user;

$(document).ready(() => {
    setFooterYear();
});

async function login(){

    if(email.val() === 'test' && password.val() === '123'){
        localStorage.user = JSON.stringify(
            {
                id: 'test',
                username: 'Test User'
            });
    }
    else {
        await $.post('php/login.php',
            {
                email: email.val(),
                password: password.val()
            },
            (result) => {
                try {
                    localStorage.user = JSON.stringify(JSON.parse(result));
                }
                catch(error) {
                    loginMessage.empty();
                    loginMessage.append(`Failed to login: ${result}`);
                }
            }
        );
        user = JSON.parse(localStorage.user);
        await getSettings();
    }

    location.href = 'index.html';
}