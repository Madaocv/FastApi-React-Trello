import { ICardList } from "./model/cardList";

export class StorageService {
    dataKey: string = 'data';

    get data(): ICardList[] { 
        const dataString = localStorage.getItem(this.dataKey);
        return JSON.parse(dataString ? dataString : '[]');
    }

    set data(data: ICardList[]) {
        localStorage.setItem(this.dataKey, JSON.stringify(data));
    }
}