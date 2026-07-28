import { Toaster } from 'sonner';

export const Notification = () => {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton={false}
      duration={5000}
      toastOptions={{
        className: 'font-sans text-sm',
      }}
    />
  );
}


