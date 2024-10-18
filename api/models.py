import asyncpg
from pydantic import BaseModel, Field
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt, JWTError, ExpiredSignatureError
from asyncpg import ForeignKeyViolationError
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from typing import List
import os

# Конфігурації
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://myuser:mypassword@localhost:5432/mydatabase")
SECRET_KEY = "DATAENCRYPTIONSTANDARDISABESTSYMMETRIC-KEYALGORITHMFORTHEENCRYPTION"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 день
REFRESH_TOKEN_EXPIRE_DAYS = 30

# Ініціалізація CryptContext
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def init_db():
    conn = await asyncpg.connect(DATABASE_URL)
    
    # Створення таблиці користувачів
    await conn.execute('''CREATE TABLE IF NOT EXISTS users (
                            id SERIAL PRIMARY KEY,
                            username TEXT UNIQUE NOT NULL,
                            password TEXT NOT NULL,
                            role TEXT NOT NULL)''')

    # Створення таблиці токенів
    await conn.execute('''CREATE TABLE IF NOT EXISTS tokens (
                            id SERIAL PRIMARY KEY,
                            user_id INTEGER NOT NULL REFERENCES users(id),
                            access_token TEXT NOT NULL,
                            refresh_token TEXT NOT NULL,
                            access_expires_at TIMESTAMPTZ NOT NULL,
                            refresh_expires_at TIMESTAMPTZ NOT NULL)''')


    # Створення таблиці списків (List)
    await conn.execute('''CREATE TABLE IF NOT EXISTS lists (
                            id SERIAL PRIMARY KEY,
                            title VARCHAR(255) NOT NULL)''')

    # Створення таблиці карток (Card)
    await conn.execute('''CREATE TABLE IF NOT EXISTS cards (
                            id SERIAL PRIMARY KEY,
                            header VARCHAR(255) NOT NULL,
                            description TEXT,
                            responsible_user_id INTEGER REFERENCES users(id),
                            assignee_id INTEGER REFERENCES users(id),
                            status_list_id INTEGER REFERENCES lists(id),
                            priority VARCHAR(10) CHECK (priority IN ('Low', 'Medium', 'High')))''')
    # await conn.close()
    try:
        # Створюємо користувача admin/admin
        hashed_password = pwd_context.hash("adminadmin")
        user_exists = await conn.fetchval("SELECT id FROM users WHERE username = $1", "admin")
        if not user_exists:
            await conn.execute('''
                INSERT INTO users (username, password, role) VALUES ($1, $2, $3)
            ''', "admin", hashed_password, "admin")
            print("Admin user created.")

        # Створюємо списки TODO, IN PROGRESS, DONE
        list_titles = ["TODO", "IN PROGRESS", "DONE"]
        for title in list_titles:
            list_exists = await conn.fetchval("SELECT id FROM lists WHERE title = $1", title)
            if not list_exists:
                await conn.execute('''
                    INSERT INTO lists (title) VALUES ($1)
                ''', title)
                print(f"List '{title}' created.")

        # Отримуємо ID списків
        todo_list_id = await conn.fetchval("SELECT id FROM lists WHERE title = 'TODO'")
        done_list_id = await conn.fetchval("SELECT id FROM lists WHERE title = 'DONE'")
        
        # Створюємо дві картки: одну в TODO і одну в DONE
        card_exists_todo = await conn.fetchval("SELECT id FROM cards WHERE header = 'Task 1 in TODO'")
        if not card_exists_todo:
            await conn.execute('''
                INSERT INTO cards (header, description, responsible_user_id, assignee_id, status_list_id, priority) 
                VALUES ($1, $2, $3, $4, $5, $6)
            ''', 'Task 1 in TODO', 'This is a sample task in TODO list', 1, 1, todo_list_id, 'Medium')
            print("Task 1 in TODO created.")
        
        card_exists_done = await conn.fetchval("SELECT id FROM cards WHERE header = 'Task 2 in DONE'")
        if not card_exists_done:
            await conn.execute('''
                INSERT INTO cards (header, description, responsible_user_id, assignee_id, status_list_id, priority) 
                VALUES ($1, $2, $3, $4, $5, $6)
            ''', 'Task 2 in DONE', 'This is a sample task in DONE list', 1, 1, done_list_id, 'High')
            print("Task 2 in DONE created.")
    finally:
        await conn.close()

class CardUpdate(BaseModel):
    header: str
    description: str
    responsible_user_id: int
    assignee_id: int
    status_list_id: int
    priority: str

class CardStatusUpdate(BaseModel):
    list_id: int

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)


class UserAuthenticate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class RefreshToken(BaseModel):
    refresh_token: str


class CardCreate(BaseModel):
    header: str
    description: str
    responsible_user_id: int
    assignee_id: int
    status_list_id: int
    priority: str

class ListCreate(BaseModel):
    title: str

# Модель для картки
class CardModel(BaseModel):
    id: int
    header: str
    description: str
    list_id: int

# Модель для списку, яка включає картки
class ListModel(BaseModel):
    id: int
    title: str
    cards: List[dict]  # Список карток

# Клас для роботи з користувачами
class User:
    @staticmethod
    async def create(user: UserCreate):
        hashed_password = pwd_context.hash(user.password)
        conn = await asyncpg.connect(DATABASE_URL)
        await conn.execute(
            "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
            user.username, hashed_password, 'user'
        )
        await conn.close()

    @staticmethod
    async def authenticate(username: str, password: str):
        conn = await asyncpg.connect(DATABASE_URL)
        user = await conn.fetchrow("SELECT password FROM users WHERE username = $1", username)
        await conn.close()
        if user and pwd_context.verify(password, user['password']):
            return True
        return False

    @staticmethod
    async def get_user_id(username: str):
        conn = await asyncpg.connect(DATABASE_URL)
        user = await conn.fetchrow("SELECT id FROM users WHERE username = $1", username)
        await conn.close()
        return user['id'] if user else None
    
    @staticmethod
    async def get_user_role(username: str):
        conn = await asyncpg.connect(DATABASE_URL)
        # Виконуємо запит до бази даних, щоб отримати роль користувача
        result = await conn.fetchrow("SELECT role FROM users WHERE username = $1", username)
        await conn.close()
        # Якщо користувач знайдений, повертаємо його роль
        if result:
            return result['role']
        return None


class Token:
    @staticmethod
    async def save_tokens(user_id: int, access_token: str, refresh_token: str):
        access_expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

        conn = await asyncpg.connect(DATABASE_URL)
        try:
            await conn.execute('''
                INSERT INTO tokens (user_id, access_token, refresh_token, access_expires_at, refresh_expires_at) 
                VALUES ($1, $2, $3, $4, $5)
            ''', user_id, access_token, refresh_token, access_expires_at, refresh_expires_at)
        finally:
            await conn.close()

    @staticmethod
    async def update_access_token(user_id: int, new_access_token: str):
        new_access_expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

        conn = await asyncpg.connect(DATABASE_URL)
        try:
            await conn.execute('''
                UPDATE tokens 
                SET access_token = $1, access_expires_at = $2
                WHERE user_id = $3
            ''', new_access_token, new_access_expires_at, user_id)
        finally:
            await conn.close()

    @staticmethod
    def create_access_token(username: str, role: str):
        to_encode = {
            "sub": username,
            "role": role}
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    @staticmethod
    def create_refresh_token(username: str):
        to_encode = {"sub": username}
        expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    @staticmethod
    async def verify_refresh_token(refresh_token: str):
        try:
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
            if payload['exp'] < datetime.now(timezone.utc).timestamp():
                raise ExpiredSignatureError("Refresh token has expired")
            return payload.get("sub")
        except ExpiredSignatureError as e:
            raise HTTPException(status_code=401, detail="Refresh token has expired")
        except JWTError as e:
            raise HTTPException(status_code=401, detail="Invalid token signature")

    @staticmethod
    async def verify_access_token(token: str) -> str:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload.get("sub")
        except JWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    @staticmethod
    async def get_current_user(token: str = Depends(oauth2_scheme)) -> int:
        username = await Token.verify_access_token(token)
        if not username:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token credentials")

        user_id = await User.get_user_id(username)
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return user_id

    @staticmethod
    async def get_current_user_role(token: str = Depends(oauth2_scheme)):
        try:
            # Розшифровуємо токен
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Отримуємо роль з payload
        role = payload.get("role")
        if role is None:
            raise HTTPException(status_code=403, detail="Role not found in token")
        
        return role


class Card:
    @staticmethod
    async def create_card(header: str, description: str, responsible_user_id: int, assignee_id: int, status_list_id: int, priority: str):
        conn = await asyncpg.connect(DATABASE_URL)
        try:
            # Вставляємо картку в таблицю
            card = await conn.fetchrow('''
                INSERT INTO cards (header, description, responsible_user_id, assignee_id, status_list_id, priority) 
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
            ''', header, description, responsible_user_id, assignee_id, status_list_id, priority)

            return card
        except ForeignKeyViolationError as e:
            raise ValueError(f"Invalid assignee_id ({assignee_id}) or status_list_id ({status_list_id}). Make sure they exist.") from e
        finally:
            await conn.close()

    @staticmethod
    async def delete_card(card_id: int):
        conn = await asyncpg.connect(DATABASE_URL)
        try:
            await conn.execute('DELETE FROM cards WHERE id = $1', card_id)  # Видаляємо картку
        finally:
            await conn.close()

    @staticmethod
    async def get_card(card_id: int):
        conn = await asyncpg.connect(DATABASE_URL)
        try:
            card = await conn.fetchrow('SELECT * FROM cards WHERE id = $1', card_id)
            if card:
                return dict(card)
            return None
        finally:
            await conn.close()

    @staticmethod
    async def update_card(card_id: int, header: str, description: str, responsible_user_id: int, assignee_id: int, status_list_id: int, priority: str):
        conn = await asyncpg.connect(DATABASE_URL)
        try:
            await conn.execute('''
                UPDATE cards 
                SET header = $1, description = $2, responsible_user_id = $3, assignee_id = $4, status_list_id = $5, priority = $6
                WHERE id = $7
            ''', header, description, responsible_user_id, assignee_id, status_list_id, priority, card_id)
        finally:
            await conn.close()

    @staticmethod
    async def update_card_status(card_id: int, status_list_id: int):
        conn = await asyncpg.connect(DATABASE_URL)
        try:
            result = await conn.execute('''
                UPDATE cards 
                SET status_list_id = $1
                WHERE id = $2
            ''', status_list_id, card_id)
            
            # Перевіряємо, чи була оновлена картка
            if result == "UPDATE 0":
                raise ValueError(f"Card with id {card_id} not found")

        finally:
            await conn.close()


class List:
    # Метод для створення списку
    @staticmethod
    async def create_list(title: str):
        conn = await asyncpg.connect(DATABASE_URL)
        try:
            # Вставляємо новий список у таблицю lists
            list_item = await conn.fetchrow('''
                INSERT INTO lists (title) VALUES ($1) RETURNING id, title
            ''', title)
            return list_item
        finally:
            await conn.close()

    # Метод для видалення списку за його ID
    @staticmethod
    async def delete_list(list_id: int):
        conn = await asyncpg.connect(DATABASE_URL)
        try:
            # Спочатку видаляємо всі картки, пов'язані з цим списком
            await conn.execute('DELETE FROM cards WHERE status_list_id = $1', list_id)
            # Видаляємо сам список
            list_item = await conn.fetchrow('DELETE FROM lists WHERE id = $1 RETURNING id, title', list_id)
            return list_item
        finally:
            await conn.close()

    # Метод для отримання списку всіх списків
    @staticmethod
    async def get_lists():
        conn = await asyncpg.connect(DATABASE_URL)
        try:
            # SQL-запит для отримання всіх списків разом з відповідними картками
            query = '''
                SELECT 
                    lists.id AS list_id, 
                    lists.title AS list_title,
                    cards.id AS card_id, 
                    cards.header, 
                    cards.description, 
                    cards.responsible_user_id, 
                    cards.assignee_id, 
                    cards.status_list_id, 
                    cards.priority
                FROM lists
                LEFT JOIN cards ON lists.id = cards.status_list_id
                ORDER BY lists.id;
            '''
            rows = await conn.fetch(query)
            
            # Обробка результатів запиту для побудови потрібної структури
            lists_dict = {}
            for row in rows:
                list_id = row['list_id']
                if list_id not in lists_dict:
                    lists_dict[list_id] = {
                        "id": list_id,
                        "title": row['list_title'],
                        "cards": []
                    }
                
                # Додаємо картку лише якщо вона існує (щоб не додавати картки для порожніх списків)
                if row['card_id'] is not None:
                    card = {
                        "id": row['card_id'],
                        "header": row['header'],
                        "description": row['description'],
                        "responsible_user_id": row['responsible_user_id'],
                        "assignee_id": row['assignee_id'],
                        "status_list_id": row['status_list_id'],
                        "priority": row['priority']
                    }
                    lists_dict[list_id]["cards"].append(card)

            # Повертаємо результат як список словників
            return list(lists_dict.values())

        finally:
            await conn.close()

    # Метод для отримання списку за його ID
    @staticmethod
    async def get_list(list_id: int):
        conn = await asyncpg.connect(DATABASE_URL)
        try:
            # Отримуємо конкретний список за його ID
            return await conn.fetchrow('SELECT * FROM lists WHERE id = $1', list_id)
        finally:
            await conn.close()
