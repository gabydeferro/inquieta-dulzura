/* Re-writing clean ConfirmContext */
import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    onConfirm: () => void;
    onCancel: () => void;
    state: {
        isOpen: boolean;
        options: ConfirmOptions;
    };
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ConfirmContextType['state']>({
        isOpen: false,
        options: {
            message: '',
            title: 'Confirmar',
            confirmText: 'Aceptar',
            cancelText: 'Cancelar',
            type: 'info'
        }
    });

    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = (options: ConfirmOptions): Promise<boolean> => {
        setState({
            isOpen: true,
            options: {
                title: 'Confirmar',
                confirmText: 'Aceptar',
                cancelText: 'Cancelar',
                type: 'info',
                ...options
            }
        });

        return new Promise((resolve) => {
            resolveRef.current = resolve;
        });
    };

    const onConfirm = () => {
        setState((prev) => ({ ...prev, isOpen: false }));
        if (resolveRef.current) {
            resolveRef.current(true);
            resolveRef.current = null;
        }
    };

    const onCancel = () => {
        setState((prev) => ({ ...prev, isOpen: false }));
        if (resolveRef.current) {
            resolveRef.current(false);
            resolveRef.current = null;
        }
    };

    return (
        <ConfirmContext.Provider value={{ confirm, onConfirm, onCancel, state }}>
            {children}
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context.confirm;
};

export const useConfirmModal = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirmModal must be used within a ConfirmProvider');
    }
    return {
        state: context.state,
        onConfirm: context.onConfirm,
        onCancel: context.onCancel
    };
};
