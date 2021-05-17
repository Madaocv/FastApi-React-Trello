import { ICard } from "./card";

export interface ICardList {
    cardListHeader: string;
    cards: ICard[];
}

export const initialData: ICardList[] =     [
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
];
