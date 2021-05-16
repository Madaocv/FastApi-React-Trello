import { ICard } from "../model/card";

export interface IAddCardProps {
    addCardItem: (card: ICard & {listIndex: number}) => void;
    listIndex: number;
}