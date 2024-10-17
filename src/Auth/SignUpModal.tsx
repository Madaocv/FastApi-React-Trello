import React, { useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { useAuth } from './AuthContext';

interface SignUpModalProps {
    onClose: () => void;  // Проп для закриття модального вікна
    switchToLogin: () => void; // Проп для перемикання на форму логіну
}

const SignUpModal: React.FC<SignUpModalProps> = ({ onClose, switchToLogin }) => {
    const { login } = useAuth();  // Використовуємо контекст авторизації
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({ username: false, password: false }); // Для булевих значень помилок
    const [errorMessages, setErrorMessages] = useState({ username: '', password: '' }); // Для повідомлень про помилки

    const handleSignUp = () => {
        // Очистимо помилки перед новою спробою
        setErrors({ username: false, password: false });
        setErrorMessages({ username: '', password: '' });

        // Запит на сервер для реєстрації
        fetch('http://127.0.0.1:8000/signup', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(res => res.json())
            .then(data => {
                if (data.detail) {
                    // Якщо є помилки валідації
                    const newErrors = { username: false, password: false };
                    const newErrorMessages = { username: '', password: '' };
                    data.detail.forEach((error: any) => {
                        if (error.loc.includes('username')) {
                            newErrors.username = true; // Встановлюємо булеву помилку для username
                            newErrorMessages.username = error.msg; // Повідомлення про помилку для username
                        }
                        if (error.loc.includes('password')) {
                            newErrors.password = true; // Встановлюємо булеву помилку для password
                            newErrorMessages.password = error.msg; // Повідомлення про помилку для password
                        }
                    });
                    setErrors(newErrors); // Встановлюємо булеві помилки
                    setErrorMessages(newErrorMessages); // Встановлюємо повідомлення про помилки
                } else if (data.access_token && data.refresh_token) {
                    // Успішний запит — зберігаємо токени в localStorage
                    localStorage.setItem('accessToken', data.access_token);
                    localStorage.setItem('refreshToken', data.refresh_token);
                    login(data.access_token, data.refresh_token);  // Аутентифікуємо користувача
                    onClose();  // Закриваємо форму
                }
            })
            .catch(error => {
                console.error('Sign Up error:', error);
            });
    };

    return (
        <Dialog open onClose={onClose}>
            <DialogTitle>Sign UP</DialogTitle>
            <DialogContent>
                <TextField
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    fullWidth
                    error={errors.username}  // Якщо є помилка, підсвічуємо поле червоним
                    helperText={errorMessages.username}  // Показуємо повідомлення про помилку
                />
                <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    error={errors.password}  // Якщо є помилка, підсвічуємо поле червоним
                    helperText={errorMessages.password}  // Показуємо повідомлення про помилку
                />
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <span>Already have an account?{' '}
                        <Button color="primary" onClick={switchToLogin}>
                            Login
                        </Button>
                    </span>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSignUp}>Sign UP</Button>
            </DialogActions>
        </Dialog>
    );
};

export default SignUpModal;
