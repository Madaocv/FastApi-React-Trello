import React from 'react';
import './List.scss';
import { IListProps } from './listProps';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';

const List: React.FC<IListProps> = ({index, header, remove, children} : IListProps) => {

    const handleDeleteClick = () => {
        remove(index);
    }

    return (
        <div className="list">
            <div className="header grid no-gap align-v-center">
                <h4 className="col-10">{header}</h4>
                <IconButton className="col-2"
                        type="button"
                        onClick={handleDeleteClick}>
                    <CloseIcon />
                </IconButton>
            </div>
            <div className="cardList">
                {children}
            </div>
        </div>
    )
}

export default List;