<?php

// create connection to database
$sqlConnection = new mysqli("localhost", "mysql", "mysql", "timer") or die("Failed to connect to database: $sqlConnection->connect_error");

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