<?php

// set database credentials
$db_name = "localhost";
$db_username = "mysql";
$db_password = "mysql";
$db_hostname= "timer";

// create connection to database
$sqlConnection = new mysqli($db_name, $db_username, $db_password, $db_hostname) or die("Connection failed: " .$sqlConnection->connect_error);

//get login details from form
$email = $_POST["email"];
$password = $_POST["password"];

//to prevent sql injection
$email = stripslashes($email);
$password = stripslashes($password);

$select_user_query = "select id, username from user where email = '$email' and password = '$password'";
$result = $sqlConnection->query($select_user_query);

if ($result->num_rows == 1)
    echo json_encode($result->fetch_assoc());
else
    echo "Invalid email address and/or password.";

//close connection to database
$sqlConnection->close();
