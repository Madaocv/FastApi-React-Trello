import { useAuth } from '../Auth/AuthContext';  // Імпортуємо хук авторизації

// Функція для оновлення access token за допомогою refresh token
const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        throw new Error('No refresh token found');
    }

    const response = await fetch('http://127.0.0.1:8000/refresh-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await response.json();
    if (data.access_token) {
        localStorage.setItem('accessToken', data.access_token);
        return data.access_token;  // Повертаємо новий access token
    } else {
        throw new Error('Failed to refresh token');
    }
};

const secureFetch = async (url: string, options: RequestInit = {}) => {
    let token = localStorage.getItem('accessToken');  // Беремо access token з localStorage

    if (!token) {
        token = await refreshAccessToken();  // Оновлюємо токен, якщо його немає
    }

    if (token) {
        // Якщо options.headers не існує, створюємо його як порожній об'єкт
        options = {
            ...options,
            headers: {
                ...(options.headers || {}),  // Якщо headers немає, використовуємо порожній об'єкт
                Authorization: `Bearer ${token}`,
            },
        };

        const response = await fetch(url, options);
        if (response.status === 401) {  // Якщо токен більше не дійсний
            const newToken = await refreshAccessToken();  // Оновлюємо токен
            if (newToken) {
                // Повторюємо запит з новим токеном
                options.headers = {
                    ...(options.headers || {}),
                    Authorization: `Bearer ${newToken}`,
                };
                return fetch(url, options);
            }
        }
        return response;
    } else {
        throw new Error('Unauthorized');
    }
};

export default secureFetch;

