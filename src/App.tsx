import React, { useState } from 'react';
import './App.scss';
import CardItem from './cardItemComponent/CardItem';
import List from './listComponent/List';
import AddList from './addListComponent/AddList';
import { ICardList, initialData } from './model/cardList';
import AddCard from './AddCardComponent/AddCard';
import { ICard } from './model/card';
import { ICardMetadata } from './cardItemComponent/cardItemProps';
import { StorageService } from './StorageService';

const App: React.FC = () => {

  const storage = new StorageService();

  const [cardLists, setcardLists] = useState<ICardList[]>(
    () => {
      if (Array.isArray(storage.data) && storage.data.length) {
        return storage.data;
      } else {
        storage.data = initialData;
        return initialData;
      }
    }
  );

  const handleListAdd = (title: string) => {
    const updatedCardList = [
      ...cardLists,
      {
        cardListHeader: title,
        cards: []
      }
    ]
    setcardLists(updatedCardList);
    storage.data = updatedCardList;
  }

  const handleListRemove = (key: number) => {
    cardLists.splice(key, 1);
    setcardLists([...cardLists]);
    storage.data = cardLists;
  }

  const handleAddCard = ({header, description, listIndex}: ICard & {listIndex: number}) => {
    const cardList = cardLists[listIndex];
    cardList.cards.push({header, description})
    setcardLists([...cardLists]);
    storage.data = cardLists;
  }

  const handleCardRemove = ({listIndex, cardIndex}: ICardMetadata) => {
    const cardList = cardLists[listIndex];
    cardList.cards.splice(cardIndex, 1);
    setcardLists([...cardLists]);
    storage.data = cardLists;
  }

  return (
    <div className="app">
      <header className="grid center">
        <h1 className="col-12">Trello Board</h1>
      </header>
      <AddList listAddition={handleListAdd}/>
      <section>
        {cardLists.map( ({cardListHeader, cards}, listIndex) => (
          <List header={cardListHeader}
                remove={handleListRemove}
                key={listIndex}
                index={listIndex}>
            {cards.map( ({header, description}, cardIndex) => (
              <CardItem header={header}
                    description={description}
                    cardIndex={cardIndex}
                    listIndex={listIndex}
                    removeClick={handleCardRemove}
                    key={cardIndex} />
            ))}
            <AddCard listIndex={listIndex}
                    addCardItem={handleAddCard}/>
          </List>
        ))}

      </section>
    </div>
  );
}

export default App;
