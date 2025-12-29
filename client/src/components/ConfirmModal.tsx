import React, { useEffect, useRef } from 'react';
import { useConfirmModal } from '../contexts/ConfirmContext';
import './ConfirmModal.css';

const ConfirmModal: React.FC = () => {
    const { state, onConfirm, onCancel } = useConfirmModal();
    const { isOpen, options } = state;
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onCancel();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onCancel]);

    // Focus management could be added here

    if (!isOpen) return null;

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div
                className="confirm-content"
                onClick={(e) => e.stopPropagation()}
                ref={modalRef}
                role="dialog"
                aria-modal="true"
            >
                <div className="confirm-icon-container">
                    {options.type === 'danger' && <span className="confirm-icon danger">🗑️</span>}
                    {options.type === 'warning' && <span className="confirm-icon warning">⚠️</span>}
                    {options.type === 'info' && <span className="confirm-icon info">ℹ️</span>}
                </div>

                <h3 className="confirm-title">{options.title}</h3>
                <p className="confirm-message">{options.message}</p>

                <div className="confirm-actions">
                    <button className="btn-cancel" onClick={onCancel}>
                        {options.cancelText}
                    </button>
                    <button
                        className={`btn-confirm ${options.type}`}
                        onClick={onConfirm}
                        autoFocus
                    >
                        {options.confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
