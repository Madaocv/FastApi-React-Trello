import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import { ICardList } from '../model/cardList';
import { useAuth } from '../Auth/AuthContext';
import LoginModal from '../Auth/SignInModal';
import SignUpModal from '../Auth/SignUpModal';

interface AddCardProps {
    lists: ICardList[];
    addCard: ({ header, description, listIndex }: { header: string; description: string; listIndex: number }) => void;
}

const AddCard: React.FC<AddCardProps> = ({ lists, addCard }) => {
    const { isAuthenticated, login } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [header, setHeader] = useState('');
    const [description, setDescription] = useState('');
    const [selectedListIndex, setSelectedListIndex] = useState<number | null>(null);
    const [errors, setErrors] = useState({ header: false, description: false, listIndex: false });
    const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
    const [isSignUpDialogOpen, setIsSignUpDialogOpen] = useState(false);
    const handleAddCardClick = () => {
        if (!isAuthenticated) {
            setIsLoginDialogOpen(true);
            return;
        }

        setIsDialogOpen(true);
    };
    const switchToSignUp = () => {
        setIsLoginDialogOpen(false);
        setIsSignUpDialogOpen(true);
    };

    const switchToLogin = () => {
        setIsSignUpDialogOpen(false);
        setIsLoginDialogOpen(true);
    };
    const handleSubmit = () => {
        const newErrors = {
            header: header.trim() === '',
            description: description.trim() === '',
            listIndex: selectedListIndex === null || selectedListIndex === -1
        };

        setErrors(newErrors);
        if (!newErrors.header && !newErrors.description && !newErrors.listIndex) {
            addCard({ header, description, listIndex: selectedListIndex! });
            setHeader('');
            setDescription('');
            setSelectedListIndex(null);
            setIsDialogOpen(false); // Закриваємо форму після додавання
        }
    };

    return (
        <div className="addListButtonContainer">
            <Button
                variant="outlined"
                onClick={handleAddCardClick}
                disabled={lists.length === 0}
            >
                Add Card
            </Button>

            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
                <DialogTitle>Add New Card</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Card Title"
                        value={header}
                        onChange={(e) => setHeader(e.target.value)}
                        fullWidth
                        margin="normal"
                        error={errors.header}
                        helperText={errors.header ? "Title is required" : ""}
                    />
                    <TextField
                        label="Card Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                        margin="normal"
                        multiline
                        error={errors.description}
                        helperText={errors.description ? "Description is required" : ""}
                    />
                    <TextField
                        select
                        label="Select List"
                        value={selectedListIndex ?? -1}
                        onChange={(e) => setSelectedListIndex(Number(e.target.value))}
                        SelectProps={{ native: true }}
                        fullWidth
                        margin="normal"
                        error={errors.listIndex}
                        helperText={errors.listIndex ? "List selection is required" : ""}
                    >
                        <option value={-1} disabled>Select List</option>
                        {lists.map((list, index) => (
                            <option key={index} value={index}>
                                {list.title}
                            </option>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDialogOpen(false)} color="secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} color="primary">
                        Add Card
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Модальне вікно для логіну */}
            {isLoginDialogOpen && (
                <LoginModal
                    onClose={() => setIsLoginDialogOpen(false)}
                    switchToSignUp={switchToSignUp}
                />
            )}

            {/* Модальне вікно для реєстрації */}
            {isSignUpDialogOpen && (
                <SignUpModal
                    onClose={() => setIsSignUpDialogOpen(false)}
                    switchToLogin={switchToLogin}
                />
            )}
        </div>
    );
};

export default AddCard;
