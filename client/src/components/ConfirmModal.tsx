import { useConfirmModal } from "../contexts/ConfirmContext";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2, Info } from "lucide-react";

function ConfirmModal() {
  const { state, onConfirm, onCancel } = useConfirmModal();
  const { isOpen, options } = state;

  const iconMap = {
    danger: <Trash2 className="size-6 text-destructive" />,
    warning: <AlertTriangle className="size-6 text-warning" />,
    info: <Info className="size-6 text-info" />,
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia>
            {options.type ? iconMap[options.type] : iconMap.info}
          </AlertDialogMedia>
          <AlertDialogTitle>{options.title || "Confirmar"}</AlertDialogTitle>
          <AlertDialogDescription>{options.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {options.cancelText || "Cancelar"}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={options.type === "danger" ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {options.confirmText || "Aceptar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmModal;
