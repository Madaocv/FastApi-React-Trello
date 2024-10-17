import React, { useState } from 'react';
import './App.scss';
import { AuthProvider, useAuth } from './Auth/AuthContext';  // Імпортуємо контекст
import Button from '@material-ui/core/Button';
import CardItem from './cardItemComponent/CardItem';
import List from './listComponent/List';
import AddList from './addListComponent/AddList';
import AddCard from './AddCardComponent/AddCard'; // новий компонент
import { ICardList, initialData } from './model/cardList';
import { ICard } from './model/card';
import { ICardMetadata, ICardProps } from './cardItemComponent/CardItem';
import { StorageService } from './StorageService';
import Link from '@material-ui/core/Link';

const App: React.FC = () => {
  const { isAuthenticated, logout, token } = useAuth();  // Отримуємо стан авторизації

  // Декодуємо токен, щоб отримати ім'я користувача (або передаємо в контексті)
  const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const username = decodedToken?.sub || 'User';
  let draggedCard: Omit<ICardProps, 'removeClick' | 'dragAction'>;
  const storage = new StorageService();

  const [cardLists, setCardLists] = useState<ICardList[]>(() => {
    if (Array.isArray(storage.data) && storage.data.length) {
      return storage.data;
    } else {
      storage.data = initialData;
      return initialData;
    }
  });

  const handleListAdd = (title: string) => {
    const updatedCardList = [
      ...cardLists,
      {
        cardListHeader: title,
        cards: [],
      },
    ];
    setCardLists(updatedCardList);
    storage.data = updatedCardList;
  };

  const handleListRemove = (key: number) => {
    cardLists.splice(key, 1);
    setCardLists([...cardLists]);
    storage.data = cardLists;
  };

  const handleAddCard = ({
    header,
    description,
    listIndex,
  }: ICard & { listIndex: number }) => {
    const cardList = cardLists[listIndex];
    cardList.cards.push({ header, description });
    setCardLists([...cardLists]);
    storage.data = cardLists;
  };

  const handleCardRemove = ({ listIndex, cardIndex }: ICardMetadata) => {
    const cardList = cardLists[listIndex];
    cardList.cards.splice(cardIndex, 1);
    setCardLists([...cardLists]);
    storage.data = cardLists;
  };

  const setDragged = (card: Omit<ICardProps, 'removeClick' | 'dragAction'>) => {
    draggedCard = card;
  };

  const cardDropped = (listIndex: number) => {
    const movedToList = cardLists[listIndex];
    const movedFromList = cardLists[draggedCard.listIndex];
    movedFromList.cards.splice(draggedCard.cardIndex, 1);
    movedToList.cards.unshift({
      header: draggedCard.header,
      description: draggedCard.description,
    });
    setCardLists([...cardLists]);
  };

  return (
    // <AuthProvider>
    <div className="app">
      <header className="grid center">
        <h1 className="col-12">
          Trello Board
          {isAuthenticated && (
            <>
              <span>Welcome, {username}!</span>
              {/* <button onClick={logout} style={{ marginLeft: '10px' }}>Logout</button> */}
              <Button
                variant="outlined"     // Та ж стилізація, що й у кнопки ADD CARD
                // color="primary"        // Колір кнопки
                onClick={logout}       // Дія при натисканні
                style={{ marginLeft: '10px' }}  // Відступ зліва
              >
                Logout
              </Button>
            </>
          )}
        </h1>
      </header>
      {/* <div>
        <AddCard lists={cardLists} addCard={handleAddCard} />
        <AddList listAddition={handleListAdd} />


      </div> */}
      <div className="addListButtonContainer">
        <AddCard lists={cardLists} addCard={handleAddCard} />
        <AddList listAddition={handleListAdd} />
      </div>
      <section>
        {cardLists.map(({ cardListHeader, cards }, listIndex) => (
          <List
            header={cardListHeader}
            remove={handleListRemove}
            cardDropped={cardDropped}
            key={listIndex}
            index={listIndex}
          >
            {cards.map(({ header, description }, cardIndex) => (
              <CardItem
                header={header}
                description={description}
                cardIndex={cardIndex}
                listIndex={listIndex}
                removeClick={handleCardRemove}
                dragAction={setDragged}
                key={cardIndex}
              />
            ))}
          </List>
        ))}
      </section>
      {/* <Link href="./Sidharth-Resume.pdf" download="">
        Download my Résumé
      </Link> */}
    </div>
    // </AuthProvider>
  );
};

// export default App;
const WrappedApp: React.FC = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default WrappedApp;
