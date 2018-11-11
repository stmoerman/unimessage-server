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
REST API: `/register POST`
* receive:
    ```
    {
        email: 
        username: 
        password:
        passwordConf:
        ip:
        port:
    }
    ```
* return:
    ```
    {
        flag: [true|false],
        msg: [log infos]
    }
    ```

1. Form checking:
    * password and confirm password should be the same.
    * all fields have no empty values.
2. Use `bcrypt` to encrypt users' password before saving.
3. Generate token and save it in the database and send it to the client side.

### 1.2 Login
REST API: `/login POST`
* receive:
    ```
    {
        email: 
        password:
        ip:
        port:
    }
    ```
* return:
    ```
    {
        flag: [true|false],
        msg: [log infos],
        // data property only exists when login successfully.
        data: {
            id_token: [token generated by JWT]
        }
    }
    ```

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
REST API: `/logout POST`
* receive:
    ```
    {
        authorization: [token in the client side]
    }
    ```
* return:
    ```
    {
        flag: [true|false],
        msg: [log infos],
    }
    ```
The purpose of logout is to delete the token in both the client and server side.
* Delete the target token by setting it as string "no".

### 1.4 Token Generation and Verification.
There are some resources: 
* [NodeJS JWT Authentication sample](https://github.com/auth0-blog/nodejs-jwt-authentication-sample)
* [5 Steps to Authenticating Node.js with JWT](https://www.codementor.io/olatundegaruba/5-steps-to-authenticating-node-js-with-jwt-7ahb5dmyr)
* [jwt with node js](https://medium.com/@siddharthac6/json-web-token-jwt-the-right-way-of-implementing-with-node-js-65b8915d550e)

## 2. Friendship Management
### 2.0 Friendship Model
Each user object has a friendship field. Each friendship field has three arrays named as `friends`, `requests`, `blocks`. Those arrays store the unique `_id` of the user object.

### 2.1 Work Flow
Assume there are two users who are user A and user B.
1. add a friend

    User A send the addFriend request to User B. This request will fail if: 
    * User A blocked User B; User B blocked User A. 
    * User B has already been a friend of User A.
    * User B decline the request.
    * User A sent a request before and User B didn't response to it.

    Otherwise, User A will be added into the User B's requests array.

    User A now have three selections:    
    * Accept:   
        * remove User B from the request array and add it into the friends array.
        * add User A into User B's friend array.
    *  Decline:
        * remove User B from the request array.
    * Block:
        * remove User B from the request array and add it into the blocks array.

2. delete a friend

    User A is a friend of User B. We can delete User B from User A's friend array and delete User A from User B's friend array.

3. unblock a user
    
    User A is blocked by User B. We can delete User A from User B's block array.

### 2.2 APIs
The APIs related with friendship management almost have the uniform interfaces. They all need to post the token to pass the authentication. Except `/friendship/info` and `/friendship/search`, the rest apis need `src_id` and `dst_id`.
* Receive
    ```
    header: {
        "authorization": token,
    }
    body: {
        src_id: [current user's id],
        dst_id: [target user's id]
    }
    ```
* Return
    ```
    {
        flag: [true|false],
        msg: [log information]
    }
    ```

|api|function|comments|
|:---:|:---:|:---:|
|/friendship/info|return a user's friends array, requests array and blocks array|the client side will visit this api every 1 sec to synchronize data|
|/friendship/search|return online users|the client side will visit this api every 1 sec to synchronize data|
|/friendship/request|send the addFriend request||
|/friendship/confirm|accept the request||
|/friendship/decline|decline the request||
|/friendship/block|block this guy||
|/friendship/unfriend|unfriend with this guy||
|/friendship/unblock|unblock this guy||

### 2.3 Additional Text
1. `async` and `await`.
2. `_id` in MongoDB.
3. object in MongoDB should be saved after changing.
