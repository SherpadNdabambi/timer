<?php

// create connection to database
$sqlConnection = new mysqli("localhost", "mysql", "mysql", "my_timer") or die("Failed to connect to database: $sqlConnection->connect_error");

// get user id
$user_id = $_POST["user_id"];

// get settings from database
$query = "select break_reminder, break_reminder_time, long_break_time, pause_reminder, pause_time_limit, play_tick_sound, short_break_time, timer_mode, volume, work_time from settings where user_id = $user_id;";
$result = $sqlConnection->query($query) or die("Failed to read database: $sqlConnection->error");

echo json_encode($result->fetch_assoc());

//close database connection
$sqlConnection->close();