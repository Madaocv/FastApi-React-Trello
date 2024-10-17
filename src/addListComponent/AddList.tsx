import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import React, { useState } from 'react';
import { IAddListProps } from './addListProps';
import { useAuth } from '../Auth/AuthContext';
import LoginModal from '../Auth/SignInModal';
import SignUpModal from '../Auth/SignUpModal';

const AddList: React.FC<IAddListProps> = ({ listAddition }: IAddListProps) => {
    const { isAuthenticated } = useAuth();
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [error, setError] = useState(false);

    const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);   // Стан для логіну
    const [isSignUpDialogOpen, setIsSignUpDialogOpen] = useState(false);

    const handleClickOpen = () => {
        if (!isAuthenticated) {
            // Якщо не авторизований, відкриваємо модальне вікно для логіну
            setIsLoginDialogOpen(true);
        } else {
            // Якщо авторизований, відкриваємо форму для додавання списку
            setOpen(true);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setError(false);
    };

    const handleAdd = () => {
        if (title.trim() === '') {
            setError(true);
        } else {
            listAddition(title);
            setTitle('');
            setOpen(false);
            setError(false);
        }
    };

    const handleLoginClose = () => {
        setIsLoginDialogOpen(false);
    };

    const handleSignUpClose = () => {
        setIsSignUpDialogOpen(false);
    };

    return (
        <React.Fragment>
            <div className="addListButtonContainer">
                <Button variant="outlined"
                    onClick={handleClickOpen}>
                    Add List
                </Button>
            </div>
            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Add new List</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To create a new list, please enter the title of the list.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="title"
                        label="List Title"
                        type="text"
                        fullWidth
                        onChange={event => setTitle(event.target.value)}
                        error={error}
                        helperText={error ? "Title is required" : ""}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}
                        color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleAdd}
                        color="primary">
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Модальне вікно для логіну */}
            {isLoginDialogOpen && (
                <LoginModal
                    onClose={handleLoginClose}
                    switchToSignUp={() => {
                        setIsLoginDialogOpen(false);
                        setIsSignUpDialogOpen(true);
                    }}
                />
            )}

            {/* Модальне вікно для реєстрації */}
            {isSignUpDialogOpen && (
                <SignUpModal
                    onClose={handleSignUpClose}
                    switchToLogin={() => {
                        setIsSignUpDialogOpen(false);
                        setIsLoginDialogOpen(true);
                    }}
                />
            )}
        </React.Fragment>

    )
}

export default AddList;