import uvicorn
from fastapi import FastAPI, HTTPException, Depends, Query, status, Request
from models import init_db, User, UserCreate, UserAuthenticate, Token, RefreshToken
from models import CardCreate, Card, CardUpdate, CardStatusUpdate, ListCreate, List, ListModel
from contextlib import asynccontextmanager
from logging.handlers import RotatingFileHandler
from fastapi.middleware.cors import CORSMiddleware
from typing import List as ChangeNamingList
import logging
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="Trello API",
    description="API для CARD LIST USER",
    version="1.0.0",
    docs_url="/swagger",
    redoc_url="/redoc-docs",
    lifespan=lifespan
    )
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
log_directory = 'logs'
log_file_path = os.path.join(log_directory, 'app.log')
if not os.path.exists(log_directory):
    os.makedirs(log_directory)
if not os.path.exists(log_file_path):
    with open(log_file_path, 'w'):
        pass
file_handler = RotatingFileHandler(log_file_path, maxBytes=5*1024*1024, backupCount=5)
file_handler.setLevel(logging.INFO)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

logger.addHandler(file_handler)
logger.addHandler(console_handler)

@app.post("/signup", status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    if await User.get_user_id(user.username):
        logger.warning(f"Attempt to register with existing username: {user.username}")
        raise HTTPException(status_code=400, detail="Username already registered")
    await User.create(user)
    logger.info(f"User registered successfully: {user.username}")
    user_id = await User.get_user_id(user.username)
    user_role = "user"
    access_token = Token.create_access_token(username=user.username, role=user_role)
    refresh_token = Token.create_refresh_token(username=user.username)

    await Token.save_tokens(
        user_id=user_id,
        access_token=access_token,
        refresh_token=refresh_token
    )
    return {
        "message": "User registered successfully",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@app.post("/signin")
async def login(user: UserAuthenticate):
    # Перевіряємо, чи існує користувач
    user_id = await User.get_user_id(user.username)
    if not user_id:
        logger.warning(f"Invalid login attempt: user '{user.username}' not found")
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid credentials",
                "reasons": ["User not found"]
            }
        )

    # Перевіряємо правильність пароля
    if not await User.authenticate(user.username, user.password):
        logger.warning(f"Invalid login attempt: wrong password for user '{user.username}'")
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid credentials",
                "reasons": ["Wrong password"]
            }
        )
    user_role = await User.get_user_role(user.username)
    access_token = Token.create_access_token(username=user.username, role=user_role)
    new_refresh_token = Token.create_refresh_token(username=user.username)
    # user_id = await User.get_user_id(user.username)
    await Token.save_tokens(
        user_id=user_id,
        access_token=access_token,
        refresh_token=new_refresh_token
    )
    logger.info(f"User logged in successfully: {user.username}")
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@app.post("/refresh-token")
async def refresh_token(token: RefreshToken):
    username = await Token.verify_refresh_token(token.refresh_token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user_role = await User.get_user_role(username)
    new_access_token = Token.create_access_token(username=username, role=user_role)
    user_id = await User.get_user_id(username)
    await Token.update_access_token(
        user_id=user_id,
        new_access_token=new_access_token
        )
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

# Роут для створення картки
@app.post("/cards/")
async def create_card(request: Request, user_id: int = Depends(Token.get_current_user)):
    try:
        # Отримуємо payload
        payload = await request.json()
        header = payload.get("header")
        description = payload.get("description")
        list_id = payload.get("list_id")
        if not header or not description or not list_id:
            raise HTTPException(status_code=400, detail="header, description, and list_id are required")
        responsible_user_id = 1
        assignee_id = 1
        priority = 'Medium'
        created_card = await Card.create_card(
            header=header,
            description=description,
            responsible_user_id=responsible_user_id,
            assignee_id=assignee_id,
            status_list_id=list_id,  # list_id буде збережено в поле status_list_id
            priority=priority
        )

        return {"card_id": created_card['id'],"header":header,"description":description, "message": "Card created successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
# Роут для видалення картки
@app.delete("/cards/{card_id}")
async def delete_card(card_id: int, user_id: int = Depends(Token.get_current_user)):
    await Card.delete_card(card_id)
    return {"message": "Card deleted successfully"}

# Роут для отримання картки
@app.get("/cards/{card_id}")
async def get_card(card_id: int, user_id: int = Depends(Token.get_current_user)):
    card = await Card.get_card(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card# PUT-ендпоінт для оновлення картки


@app.put("/cards/{card_id}")
async def update_card(card_id: int, card: CardStatusUpdate):
    try:
        # Оновлюємо тільки поле status_list_id (яке відповідає за list_id)
        await Card.update_card_status(card_id=card_id, status_list_id=card.list_id)
        return {"message": "Card status updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Роут для отримання всіх списків
@app.get("/lists/", response_model=ChangeNamingList[ListModel])
async def get_lists():
    lists = await List.get_lists()
    return lists

# Роут для створення нового списку
@app.post("/lists/")
async def create_list(list: ListCreate, user_id: int = Depends(Token.get_current_user)):
    new_list = await List.create_list(title=list.title)
    return {"id": new_list['id'], "title": new_list['title'], "message": "List created successfully"}

# Роут для видалення списку
@app.delete("/lists/{list_id}")
async def delete_list(list_id: int, user_id: int = Depends(Token.get_current_user)):
    deleted_list = await List.delete_list(list_id)
    if deleted_list is None:
        raise HTTPException(status_code=404, detail="List not found")
    return {"id": deleted_list['id'], "title": deleted_list['title'], "message": "List deleted successfully"}


@app.get("/admin")
async def admin_dashboard(role: str = Depends(Token.get_current_user_role)):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access only")
    return {"message": "Welcome to the admin dashboard"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
