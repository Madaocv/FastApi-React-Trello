export interface ICardMetadata {
    cardIndex: number;
    listIndex: number;
}

export interface ICardProps extends ICardMetadata {
    header: string;
    description: string;
    removeClick: ({cardIndex, listIndex}: ICardMetadata) => void;
}