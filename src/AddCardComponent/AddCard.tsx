import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import TextField from "@material-ui/core/TextField";
import React, { useState } from "react";
import { IAddCardProps } from "./AddCardProps";
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";


const AddCard: React.FC<IAddCardProps> = ({addCardItem, listIndex}: IAddCardProps) => {

    const [cardTitle, setCardTitle] = useState('');
    const [cardDescription, setCardDescription] = useState('');
    const [showCard, setShowCard] = useState(false);
    const [showCardTitleError, setCardTitleError] = useState(false);

    const handleAddButtonClick = () => {
        if(!cardTitle) {
            setCardTitleError(true);
            return;
        }
        setCardTitleError(false);
        addCardItem({
            listIndex,
            header: cardTitle,
            description: cardDescription
        });
        setShowCard(false);
    }

    const handleFooterButtonClick = () => setShowCard(true);

    return (
        <React.Fragment>
            <footer className="grid center no-gap">
                <button onClick={handleFooterButtonClick}
                        type="button"
                        className="icon-button col-12">
                    <ControlPointIcon />
                </button>
            </footer>
            { showCard ? 
                <Card>
                    <CardContent>
                        <TextField id="card-title"
                                    label="Card Title"
                                    error={showCardTitleError}
                                    onChange={event => setCardTitle(event.target.value)}/>
                        <TextField id="card-description"
                                    label="Card Description"
                                    onChange={event => setCardDescription(event.target.value)}/>
                        
                    </CardContent>
                    <CardActions>
                        <Button onClick={handleAddButtonClick}
                                variant="outlined"
                                color="primary"
                                size="small">
                            Add Card
                        </Button>
                    </CardActions>
                </Card> :
                null
            }
            
        </React.Fragment>
    )
}

export default AddCard;