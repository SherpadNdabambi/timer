<?php

// start session
session_start();

// set database credentials
$db_name = "localhost";
$db_username = "mysql";
$db_password = "mysql";
$db_hostname= "timer";

// create connection to database
$sqlConnection = new mysqli($db_name, $db_username, $db_password, $db_hostname) or die("Connection failed: " .$sqlConnection->connect_error);

// get session data from session form
$date_started = $_POST["date_started"];
$date_stopped = $_POST["date_stopped"];
$task_name = $_POST["task_name"];
$time_started = $_POST["time_started"];
$time_stopped = $_POST["time_stopped"];
$time_worked = $_POST["time_worked"];
$type = $_POST["type"];
$user_id = $_POST["user_id"];

// to prevent sql injection
$date_started = stripslashes($date_started);
$date_stopped = stripslashes($date_stopped);
$task_name = stripslashes($task_name);
$time_started = stripslashes($time_started);
$time_stopped = stripslashes($time_stopped);
$time_worked = stripslashes($time_worked);
$type = stripslashes($type);
$user_id = stripslashes($user_id);

echo "task_name: $task_name<br>";
echo "date_started: $date_started<br>";
echo "date_stopped: $date_stopped<br>";
echo "time_started: $time_started<br>";
echo "time_stopped: $time_stopped<br>";
echo "time_worked: $time_worked<br>";
echo "type: $type<br>";

// create task if task does not exist
$selectTaskQuery = "select * from task where user_id = " . $user_id . " and name = '$task_name';";
$result = $sqlConnection->query($selectTaskQuery);
if (mysqli_num_rows($result) == 0) {
	$createTaskQuery = "insert into task (user_id, name) values (" . $user_id . ", '$task_name');";
	$sqlConnection->query($createTaskQuery) or die("Failed to save task: " . $sqlConnection->error);
}

// create session
$createSessionQuery = "insert into session (task_id, user_id, date_started, date_stopped, time_started, time_stopped, time_worked, type) values ((select id from task where name = '$task_name'), " . $user_id . ", '$date_started', '$date_stopped', '$time_started', '$time_stopped', '$time_worked', '$type');";
if($sqlConnection->query($createSessionQuery)) echo "session saved successfully";
else echo "Failed to save session: " . $sqlConnection->error;

// close connection to database
$sqlConnection->close();