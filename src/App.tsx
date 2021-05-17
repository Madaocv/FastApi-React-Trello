import React, { useState } from 'react';
import './App.scss';
import CardItem from './cardItemComponent/CardItem';
import List from './listComponent/List';
import AddList from './addListComponent/AddList';
import { ICardList, initialData } from './model/cardList';
import AddCard from './AddCardComponent/AddCard';
import { ICard } from './model/card';
import { ICardMetadata, ICardProps } from './cardItemComponent/cardItemProps';
import { StorageService } from './StorageService';
import Link from '@material-ui/core/Link';

const App: React.FC = () => {

  let draggedCard: Omit<ICardProps, 'removeClick' | 'dragAction'>;
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

  const setDragged = (card: Omit<ICardProps, 'removeClick' | 'dragAction'>) => {
    draggedCard = card
  }

  const cardDropped = (listIndex: number) => {
    const movedToList = cardLists[listIndex];
    const movedFromList = cardLists[draggedCard.listIndex];
    movedFromList.cards.splice(draggedCard.cardIndex, 1);
    movedToList.cards.unshift({
      header: draggedCard.header,
      description: draggedCard.description
    });
    setcardLists([...cardLists]);
  }

  return (
    <div className="app">
      <header className="grid center">
        <h1 className="col-12">Trello Board</h1>
      </header>
      <div>
        <AddList listAddition={handleListAdd}/>
      </div>
      <section>
        {cardLists.map( ({cardListHeader, cards}, listIndex) => (
          <List header={cardListHeader}
                remove={handleListRemove}
                cardDropped={cardDropped}
                key={listIndex}
                index={listIndex}>
            {cards.map( ({header, description}, cardIndex) => (
              <CardItem header={header}
                    description={description}
                    cardIndex={cardIndex}
                    listIndex={listIndex}
                    removeClick={handleCardRemove}
                    dragAction={setDragged}
                    key={cardIndex} />
            ))}
            <AddCard listIndex={listIndex}
                    addCardItem={handleAddCard}/>
          </List>
        ))}

      </section>
      <Link href="./Sidharth-Resume.pdf" download="" >
        Download my Résumé
      </Link>
    </div>
  );
}

export default App;
