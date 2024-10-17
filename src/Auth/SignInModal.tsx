import React, { useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { useAuth } from './AuthContext';

interface SignInModalProps {
    onClose: () => void;  // Проп для закриття модального вікна
    switchToSignUp: () => void; // Проп для перемикання на Sign UP форму
}

const SignInModal: React.FC<SignInModalProps> = ({ onClose, switchToSignUp }) => {
    const { login } = useAuth();  // Використовуємо контекст авторизації
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({ username: false, password: false });
    const [errorMessages, setErrorMessages] = useState({ username: '', password: '' });
    const [generalError, setGeneralError] = useState('');  // Загальне повідомлення про помилки авторизації

    const handleLogin = () => {
        // Очистимо попередні помилки
        setErrors({ username: false, password: false });
        setErrorMessages({ username: '', password: '' });
        setGeneralError('');

        // Запит на сервер для логіну
        fetch('http://127.0.0.1:8000/signin', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(res => res.json())
            .then(data => {
                if (data.detail) {
                    // Обробляємо помилки
                    if (Array.isArray(data.detail)) {
                        // Це помилки валідації (масив)
                        const newErrors = { username: false, password: false };
                        const newErrorMessages = { username: '', password: '' };

                        data.detail.forEach((error: any) => {
                            if (error.loc.includes('username')) {
                                newErrors.username = true;
                                newErrorMessages.username = error.msg;
                            }
                            if (error.loc.includes('password')) {
                                newErrors.password = true;
                                newErrorMessages.password = error.msg;
                            }
                        });

                        setErrors(newErrors);
                        setErrorMessages(newErrorMessages);
                    } else {
                        // Це помилки авторизації
                        if (data.detail.reasons) {
                            setGeneralError(data.detail.reasons.join(', '));  // Виводимо загальну помилку
                        } else {
                            setGeneralError(data.detail.error || 'Invalid credentials');
                        }
                    }
                } else if (data.access_token && data.refresh_token) {
                    // Успішний логін
                    localStorage.setItem('accessToken', data.access_token);
                    localStorage.setItem('refreshToken', data.refresh_token);
                    login(data.access_token, data.refresh_token);  // Аутентифікуємо користувача
                    onClose();  // Закриваємо форму
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                setGeneralError('Something went wrong. Please try again.');
            });
    };

    return (
        <Dialog open onClose={onClose}>
            <DialogTitle>Login</DialogTitle>
            <DialogContent>
                {/* Поле для введення логіну */}
                <TextField
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    fullWidth
                    error={errors.username}  // Якщо є помилка, підсвічуємо поле червоним
                    helperText={errorMessages.username}  // Показуємо повідомлення про помилку
                />
                {/* Поле для введення пароля */}
                <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    error={errors.password}  // Якщо є помилка, підсвічуємо поле червоним
                    helperText={errorMessages.password}  // Показуємо повідомлення про помилку
                />
                {/* Виведення загального повідомлення про помилки (наприклад, "User not found" або "Wrong password") */}
                {generalError && (
                    <p style={{ color: 'red' }}>{generalError}</p>
                )}
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <span>You have no account?{' '}
                        <Button color="primary" onClick={switchToSignUp}>
                            Sign UP
                        </Button>
                    </span>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleLogin}>Login</Button>
            </DialogActions>
        </Dialog>
    );
};

export default SignInModal;
