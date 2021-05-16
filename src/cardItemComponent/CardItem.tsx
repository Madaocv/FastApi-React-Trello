import React from 'react';
import { ICardProps } from "./cardItemProps";
import CloseIcon from '@material-ui/icons/Close';
import './CardItem.scss';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import IconButton from '@material-ui/core/IconButton';

const CardItem: React.FC<ICardProps> = ({header, description, removeClick, cardIndex, listIndex} : ICardProps) => {

    const handleRemoveClick = () => removeClick({
        cardIndex,
        listIndex
    })

    return (
        <Card draggable="true"
            className="card">
            <CardContent>
                <h5>{header}</h5>
                <IconButton onClick={handleRemoveClick}
                        className="icon-button"
                        size="small">
                    <CloseIcon />
                </IconButton>
                <p>
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

export default CardItem;