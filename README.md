# Getting Started with Trello Board

[Word документація достуана за посиланням](https://docs.google.com/document/d/1a4stKORyEc07yv0IUyrgbpMFK19zpEI08gOP5GjIVAY/edit?usp=sharing)
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
### 4. Create CARD
```bash
curl -X POST http://localhost:8000/cards/ \
-H "Content-Type: application/json" \
-H "Authorization: Bearer your_access_token_here" \
-d '{
  "header": "New Task",
  "description": "Complete the project",
  "list_id": 1
}'
```
### 5. Update status CARD
```bash
curl -X PUT http://localhost:8000/cards/1 \
-H "Content-Type: application/json" \
-H "Authorization: Bearer your_access_token_here" \
-d '{
  "list_id": 2
}'
```
### 6. Get CARD
```bash
curl -X GET http://localhost:8000/cards/1 \
-H "Authorization: Bearer your_access_token_here"
```
### 7. Del CARD
```bash
curl -X DELETE http://localhost:8000/cards/1 \
-H "Authorization: Bearer your_access_token_here"
```
### 8. Get all LIST
```bash
curl -X GET http://localhost:8000/lists/
```
### 9. Create LIST
```bash
curl -X POST http://localhost:8000/lists/ \
-H "Content-Type: application/json" \
-H "Authorization: Bearer your_access_token_here" \
-d '{
  "title": "New List"
}'
```
### 10. Del LIST
```bash
curl -X DELETE http://localhost:8000/lists/1 \
-H "Authorization: Bearer your_access_token_here"
```
## API Documentation

### Documentation with Swagger UI (call and test your API directly from the browser) is available at URL: http://127.0.0.1:8000/swagger
![Swagger UI](img/swagger.png)
*Swagger UI*
### Documentation with ReDoc is available at URL: http://127.0.0.1:8000/redoc-docs
![ReDoc](img/redoc.png)
*ReDoc*