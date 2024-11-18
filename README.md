# Node Authentication Service

This project is a Node.js authentication service that provides basic sign-up, sign-in, sign-out, refresh token functionalities, and a protected route using JWT for authentication. It uses **Express.js** for the web framework, **MySQL** as the database, and **Knex** as the query builder.

## Features
- **Sign Up**: Register new users.
- **Sign In**: Authenticate users and provide JWT tokens.
- **Sign Out**: Revoke refresh tokens associated with a user.
- **Refresh Token**: Generate a new access token using a valid refresh token.
- **Protected Routes**: Access restricted endpoints using JWT.

## Tech Stack
- **Node.js** with **Express.js** for building the API.
- **MySQL** for database management.
- **Knex** for interacting with the database.
- **express-jwt** for protecting routes.
- **jsonwebtoken** for handling token generation and verification.
- **bcrypt** for hashing user passwords.
- **dotenv** for environment variable management.
- **Jest** for unit testing.

## Installation

### Prerequisites
- **Node.js** (>= 14.x recommended)
- **MySQL** database server

### Setup
1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd node-auth-service
   ```

2. Install the dependencies:
   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```env
   DB_HOST=your_mysql_host
   DB_PORT=your_mysql_port
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=your_mysql_database_name
   SECRET_KEY=your_secret_key
   PORT=3000
   ```

4. Make sure your MySQL database is set up with the correct tables (`Users` and `Tokens`).

## Running the Application
To start the application in development mode:
```sh
npm run dev
```
Or to start in production mode:
```sh
npm start
```
The server will start on the port specified in your `.env` file (default is `3000`).

## Endpoints
### Public Endpoints
- **POST /auth/sign-up**
    - Register a new user.
    - **Body**:
      ```json
      {
        "email": "string",
        "password": "string",
        "firstName": "string",
        "lastName": "string"
      }
      ```
- **POST /auth/sign-in**
    - Authenticate a user and return access/refresh tokens.
    - **Body**:
      ```json
      {
        "email": "string",
        "password": "string"
      }
      ```
- **POST /auth/refresh-token**
    - Refresh an expired access token.
    - **Body**:
      ```json
      {
        "refreshToken": "string"
      }
      ```
- **POST /auth/sign-out**
    - Sign out a user and revoke all refresh tokens associated with the user.
    - **Headers**: Requires `Authorization: Bearer <token>`

### Protected Endpoints
- **GET /auth/protected**
    - Access this route using a valid JWT.
    - **Headers**: Requires `Authorization: Bearer <token>`

## Testing

### Running Unit Tests
This project includes unit tests implemented using **Jest**.
To run the tests, use the following command:
```sh
npm run test
```
The tests cover the main authentication endpoints to ensure they work as expected.

## Usage Instructions
1. Use the **Sign-Up** endpoint to create a new user.
2. Use the **Sign-In** endpoint to log in with an existing user and receive an access token and refresh token.
3. Use the **Refresh Token** endpoint to get a new access token when the old one expires.
4. Use the **Sign-Out** endpoint to invalidate all tokens.
5. To access protected routes, add the `Authorization: Bearer <token>` header to your request.

## Troubleshooting
- **Access Denied for MySQL User**: Ensure that the database user has the necessary privileges and that the credentials in the `.env` file are correct.
- **Invalid Token**: Make sure the token is correctly provided in the `Authorization` header and is not expired or revoked.
