# Unimessage(Backend)
Unimessage is a secure chatting App. The backend part is developed by Node.js and Express. The database is Mongodb.

## Features
## 1. User management
### 1.0 User Model
User collection:
* email(unique)
* username(unique)
* password(encrypted)
* ip
* port
* id_token

### 1.1 Register
1. Form checking:
    * password and confirm password should be the same.
    * all fields have no empty values.
2. Use `bcrypt` to encrypt users' password before saving.
3. Generate token and save it in the database and send it to the client side.

### 1.2 Login
There are two ways that a user login into the App.
1. The user has the token generated before.
2. Login using email and password.
    * Form checking: 
        * email
        * password
        * ip address
        * port number
    * Update ip address and port number
    * Generate a new token and assign it to the client side and update it in database.

### 1.3 Logout
The purpose of logout is to delete the token in both the client and server side.
* Delete the target token by setting it as string "no".

### 1.4 Token Generation and Verification.
There are some resources: 
* [NodeJS JWT Authentication sample](https://github.com/auth0-blog/nodejs-jwt-authentication-sample)
* [5 Steps to Authenticating Node.js with JWT](https://www.codementor.io/olatundegaruba/5-steps-to-authenticating-node-js-with-jwt-7ahb5dmyr)
* [jwt with node js](https://medium.com/@siddharthac6/json-web-token-jwt-the-right-way-of-implementing-with-node-js-65b8915d550e)
