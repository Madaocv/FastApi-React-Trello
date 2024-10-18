
export interface ICard {
    id: number;              // Поле ID картки, яке приходить з бекенду
    header: string;          // Назва картки
    description: string;     // Опис картки
    list_id: number;         // ID списку, до якого належить картка
}