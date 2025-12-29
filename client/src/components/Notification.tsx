import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import './Notification.css';

const NotificationComponent: React.FC = () => {
    const { notifications, hideNotification } = useNotification();

    if (notifications.length === 0) return null;

    return (
        <div className="notification-container">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`notification-item ${notification.type}`}
                    onClick={() => hideNotification(notification.id)}
                >
                    <div className="notification-icon">
                        {notification.type === 'success' && '✨'}
                        {notification.type === 'error' && '❌'}
                        {notification.type === 'warning' && '⚠️'}
                        {notification.type === 'info' && 'ℹ️'}
                    </div>
                    <div className="notification-message">
                        {notification.message}
                    </div>
                    <button className="notification-close">✕</button>
                </div>
            ))}
        </div>
    );
};

export default NotificationComponent;
