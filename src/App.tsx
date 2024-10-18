import React, { useEffect, useState } from 'react';
import './App.scss';
import { AuthProvider, useAuth } from './Auth/AuthContext';  // Імпортуємо контекст авторизації
import Button from '@material-ui/core/Button';
import CardItem from './cardItemComponent/CardItem';
import List from './listComponent/List';
import AddList from './addListComponent/AddList';
import AddCard from './AddCardComponent/AddCard';
import { ICardList } from './model/cardList';   // Імпортуємо інтерфейс ICardList
import { ICard } from './model/card';           // Імпортуємо інтерфейс ICard
import { ICardMetadata, ICardProps } from './cardItemComponent/CardItem';
import { StorageService } from './StorageService';
import secureFetch from './service/secureFetch';

const App: React.FC = () => {
  const { isAuthenticated, logout, token } = useAuth();  // Отримуємо стан авторизації

  // Декодуємо токен, щоб отримати ім'я користувача (або передаємо в контексті)
  const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const username = decodedToken?.sub || 'User';

  let draggedCard: Omit<ICardProps, 'removeClick' | 'dragAction'>;  // Перетягувана картка
  const storage = new StorageService();  // Локальне зберігання

  const [cardLists, setCardLists] = useState<ICardList[]>([]);  // Стан для списків і карток

  // Функція для завантаження списків з бекенду
  const fetchListsAndCards = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/lists');
      const data = await response.json();
      // console.log(data);
      setCardLists(data);  // Зберігаємо отримані списки з картками
    } catch (error) {
      console.error('Error fetching lists and cards:', error);
    }
  };

  // Виконуємо запит при завантаженні компонента
  useEffect(() => {
    fetchListsAndCards();
  }, []);

  // Додавання нового списку (без генерації ID, оскільки бекенд надасть ID)
  const handleListAdd = async (title: string) => {
    try {
      const response = await secureFetch('http://127.0.0.1:8000/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title })
      });

      const newList = await response.json();  // Новий список з бекенду

      // Оновлюємо стан cardLists правильно
      setCardLists((prevCardLists) => {
        const updatedLists = [...prevCardLists, newList];  // Додаємо новий список до кінця масиву
        return updatedLists;  // Повертаємо оновлений масив
      });

      storage.data = [...cardLists, newList];  // Оновлюємо локальне збереження
    } catch (error) {
      console.error('Error adding list:', error);
    }
  };

  // Видалення списку
  const handleListRemove = async (listId: number) => {
    try {
      await secureFetch(`http://127.0.0.1:8000/lists/${listId}`, {
        method: 'DELETE'
      });

      const updatedLists = cardLists.filter(list => list.id !== listId);
      setCardLists(updatedLists);
      storage.data = updatedLists;
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  // Додавання нової картки (без генерації ID, оскільки бекенд надасть ID)
  const handleAddCard = async ({ header, description, listIndex }: { header: string; description: string; listIndex: number }) => {
    try {
      const response = await secureFetch(`http://127.0.0.1:8000/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          header,
          description,
          list_id: cardLists[listIndex].id  // Використовуємо ID списку
        })
      });

      const newCard = await response.json();  // Отримуємо нову картку з бекенду

      // Оновлюємо список карток і переконуємося, що масив `cards` існує
      setCardLists((prevCardLists) => {
        const updatedLists = [...prevCardLists];
        const targetList = updatedLists[listIndex];

        // Якщо масив карток не існує, створюємо порожній масив
        if (!targetList.cards) {
          targetList.cards = [];
        }

        // Додаємо нову картку до списку
        targetList.cards.push(newCard);

        return updatedLists;
      });

      storage.data = cardLists; // Оновлюємо локальне сховище
    } catch (error) {
      console.error('Error adding card:', error);
    }
  };



  // Видалення картки
  const handleCardRemove = async (cardId: number, listId: number) => {
    try {
      await secureFetch(`http://127.0.0.1:8000/cards/${cardId}`, {
        method: 'DELETE'
      });

      const updatedLists = cardLists.map(list => {
        if (list.id === listId) {
          return { ...list, cards: list.cards.filter(card => card.id !== cardId) };
        }
        return list;
      });

      setCardLists(updatedLists);
      storage.data = updatedLists;
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  // Збереження перетягуваної картки
  const setDragged = (card: Omit<ICardProps, 'removeClick' | 'dragAction'>) => {
    draggedCard = card;
  };

  const cardDropped = async (newListIndex: number, cardData: { id: number; listIndex: number }) => {
    try {
      const newListId = cardLists[newListIndex].id; // Отримуємо ID нового списку

      // Запит на бекенд для оновлення картки з новим list_id
      await fetch(`http://127.0.0.1:8000/cards/${cardData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          list_id: newListId // Оновлюємо list_id на новий список
        })
      });

      // Оновлюємо стан після зміни списку картки
      setCardLists((prevCardLists) => {
        const updatedLists = [...prevCardLists];

        // Видаляємо картку з поточного списку
        const oldList = updatedLists[cardData.listIndex];
        oldList.cards = oldList.cards.filter(card => card.id !== cardData.id);

        // Додаємо картку в новий список
        const newList = updatedLists[newListIndex];

        // Якщо масив карток не існує, створюємо його
        if (!newList.cards) {
          newList.cards = [];
        }

        newList.cards.push({
          id: cardData.id,   // Використовуємо ID картки
          header: draggedCard.header,   // Ім'я картки
          description: draggedCard.description,   // Опис картки
          list_id: newListId  // Присвоюємо новий ID списку
        });

        return updatedLists;
      });

    } catch (error) {
      console.error('Error updating card:', error);
    }
  };


  return (
    <div className="app">
      <header className="grid center">
        <h1 className="col-12">
          Trello Board
          {isAuthenticated && (
            <>
              <span> Welcome, {username} !</span>
              <Button
                variant="outlined"
                onClick={logout}
                style={{ marginLeft: '10px' }}
              >
                Logout
              </Button>
            </>
          )}
        </h1>
      </header>
      <div className="addListButtonContainer">
        <AddCard lists={cardLists} addCard={handleAddCard} />
        <AddList listAddition={handleListAdd} />
      </div>
      <section>
        {cardLists && cardLists.length > 0 ? (
          cardLists.map(({ title, cards = [], id: listId }, listIndex) => ( // Перевіряємо, що cards існує і є масивом
            <List
              key={listId}  // Використовуємо id списку як унікальний ключ
              header={title}
              remove={() => handleListRemove(listId)}
              cardDropped={(listIndex, cardData) => cardDropped(listIndex, cardData)} // Викликаємо cardDropped з параметрами
              index={listIndex}
            >
              {cards && cards.length > 0 ? (
                cards.map(({ header, description, id: cardId }, cardIndex) => (
                  <CardItem
                    key={cardId}  // Використовуємо id картки як унікальний ключ
                    header={header}
                    description={description}
                    cardIndex={cardIndex}
                    listIndex={listIndex}
                    removeClick={() => handleCardRemove(cardId, listId)}
                    dragAction={setDragged}
                    id={cardId}  // ID картки як пропс
                  />
                ))
              ) : (
                <p>No cards in this list</p> // Якщо нема карток
              )}
            </List>
          ))
        ) : (
          <p>No lists available</p>  // Якщо нема списків, відображаємо повідомлення
        )}
      </section>


    </div>
  );
};

const WrappedApp: React.FC = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default WrappedApp;
