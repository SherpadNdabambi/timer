<?php

// set database credentials
$db_hostname = "127.0.0.1";
$db_username = "mysql";
$db_password = "mysql";
$db_name = "timer";

// create connection to database
$sqlConnection = new mysqli($db_hostname, $db_username, $db_password, $db_name) or die("Connection failed: " .$sqlConnection->connect_error);

// get user id
$user_id = $_POST["user_id"];

// get tasks from database
$query = "SELECT name FROM task WHERE task.user_id = $user_id";
$result = $sqlConnection->query($query) or die("Failed to read database: " .$sqlConnection->error);

while($row = $result->fetch_assoc()) {
   $tasks[] = $row;
}

echo json_encode($tasks);

//close database connection
$sqlConnection->close();