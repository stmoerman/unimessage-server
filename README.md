# Unimessage
A secure chatting App.

## Features
### 1. Register
* Users need to input the following properties to register an account:
    * email(unique)
    * username(unique)
    * password
    * password confirm
* we will collect users' chatting `IP address` and `port number` and store them in the database.
* we do the form checking in the server side:
    * password and confirm password should be the same
    * all fields must be input
* Before each time we saving users, we will use bcrypt to encrypt users' password.

### 2. Login
* If the user has an avaliable session, he/she can enter into the app without login.
* Or, the user need to input email and password to login.
    * we will collect users' IP address and port number and update it in the database.