# Getting Started with Trello Board

## Setup

### 1. Clone the repository:

```bash
git clone https://github.com/Madaocv/FastApi-React-Trello.git
cd FastApi-React-Trello
```
### 2. Building and Running the service command:

```bash
docker-compose up --build
```
![User actions with Trello board](img/RecordTrello_fast_x3.gif)
*User actions with Trello board*

## Usage

### 1. cURL for registration:
```bash
curl -X POST "http://127.0.0.1:8000/signup" \
-H "Content-Type: application/json" \
-d '{"username": "newuser", "password": "newpassword"}'
```
### 2. cURL for login:
```bash
curl -X POST "http://127.0.0.1:8000/signin" \
-H "Content-Type: application/json" \
-d '{"username": "newuser", "password": "newpassword"}'
```
### 3. cURL refresh expired token:
```bash
curl -X POST "http://127.0.0.1:8000/refresh-token" \
-H "Content-Type: application/json" \
-d '{"refresh_token": "your_refresh_token_here"}'
```

## API Documentation

### Documentation with Swagger UI (call and test your API directly from the browser) is available at URL: http://127.0.0.1:8000/swagger
![Swagger UI](img/swagger.png)
*Swagger UI*
### Documentation with ReDoc is available at URL: http://127.0.0.1:8000/redoc-docs
![ReDoc](img/redoc.png)
*ReDoc*