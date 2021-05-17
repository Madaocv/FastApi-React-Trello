import { ReactNode } from "react";

export interface IListProps {
    index: number;
    header: string;
    remove: (key: number) => void;
    cardDropped: (listIndex: number) => void;
    children: ReactNode;
}