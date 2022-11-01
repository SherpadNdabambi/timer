function getSettings(){

    return new Promise(async (resolve) => {
        if (!localStorage.user.settings) {
            if (user.id === 'test')
                user.settings =
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
                    };
            else
                await $.post('php/getSettings.php',
                    {
                        user_id: user.id
                    },
                    (result) => {
                        user.settings = JSON.parse(result);
                    }
                );

            localStorage.user = JSON.stringify(user);
        }
        else user = JSON.parse(localStorage.user);
        getSettingVariables();
        resolve();
    });
}

function getSettingVariables(){
    
    //assign settings to setting variables
    breakReminder = user.settings.break_reminder;
    breakReminderTime = new Time(user.settings.break_reminder_time);
    longBreakTime = new Time(user.settings.long_break_time);
    pauseReminder = user.settings.pause_reminder;
    pauseTimeLimit = new Time(user.settings.pause_time_limit);
    playTickSound = user.settings.play_tick_sound;
    shortBreakTime = new Time(user.settings.short_break_time);
    timerMode = user.settings.timer_mode;
    volume = user.settings.volume / 100;
    workTime = new Time(user.settings.work_time);
}