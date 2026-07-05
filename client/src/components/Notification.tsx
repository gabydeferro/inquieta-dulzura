import { Toaster } from "sonner";

function Notification() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={5000}
      toastOptions={{
        className: "font-sans text-sm",
      }}
    />
  );
}

export default Notification;
