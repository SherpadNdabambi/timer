<?php

// set database credentials
$db_hostname = "127.0.0.1";
$db_username = "mysql";
$db_password = "mysql";
$db_name = "timer";

// create connection to database
$sqlConnection = new mysqli($db_hostname, $db_username, $db_password, $db_name) or die("Connection failed: " .$sqlConnection->connect_error);

// get parameters
$user_id = $_POST["user_id"];
$volume = $_POST["volume"];

//to prevent sql injection
$user_id = stripslashes($user_id);
$volume = stripslashes($volume);

//update settings
$query = "update settings set volume = '$volume' where user_id = $user_id;";
$sqlConnection->query($query) or die("Failed to update settings: " .$sqlConnection->error);

//close database connection
$sqlConnection->close();