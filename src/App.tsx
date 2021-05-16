import React, { useState } from 'react';
import './App.scss';
import CardItem from './cardItemComponent/CardItem';
import List from './listComponent/List';
import AddList from './addListComponent/AddList';
import { ICardList } from './model/cardList';
import AddCard from './AddCardComponent/AddCard';
import { ICard } from './model/card';
import { ICardMetadata } from './cardItemComponent/cardItemProps';

const App: React.FC = () => {

  const [cardLists, setcardLists] = useState<ICardList[]>(
    [
      {
        cardListHeader: 'Teams',
        cards: [
          {
            header: 'Product',
            description: '3 pending tasks to be picked by Raj.'
          },
          {
            header: 'Sales',
            description: 'Send proposal to Puneet for sales prices.'
          }
        ]

      },
      {
        cardListHeader: 'Products',
        cards: [
          {
            header: 'UAT Testing',
            description: 'Ask testing engg. to set up testing infrastructure.'
          }
        ]
      }
    ]
  );

  const handleListAdd = (title: string) => {
    setcardLists([
      ...cardLists,
      {
        cardListHeader: title,
        cards: []
      }
    ]);
  }

  const handleListRemove = (key: number) => {
    cardLists.splice(key, 1);
    setcardLists([...cardLists]);
  }

  const handleAddCard = ({header, description, listIndex}: ICard & {listIndex: number}) => {
    const cardList = cardLists[listIndex];
    cardList.cards.push({header, description})
    setcardLists([...cardLists]);
  }

  const handleCardRemove = ({listIndex, cardIndex}: ICardMetadata) => {
    const cardList = cardLists[listIndex];
    cardList.cards.splice(cardIndex, 1);
    setcardLists([...cardLists]);
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
