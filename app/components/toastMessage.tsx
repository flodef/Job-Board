export enum ToastType {
  Success,
  Error,
  Warning,
}

interface ToastProps {
  type: ToastType;
  message: string;
  onClose?: () => void;
}

export const ToastMessage = ({ type, message, onClose }: ToastProps) => {
  const typeStyles = {
    [ToastType.Success]: 'bg-green-500 animate-fade-in-up',
    [ToastType.Error]: 'bg-[#fb8c8c] animate-shake',
    [ToastType.Warning]: 'bg-yellow-500 animate-fade-in-up',
  };
  const typeIcon = {
    [ToastType.Success]: '✅ ',
    [ToastType.Error]: '❌ ',
    [ToastType.Warning]: '⚠️ ',
  };

  // Auto-close the toast after 3 seconds if onClose is provided
  if (onClose) {
    setTimeout(onClose, 3000);
  }

  return (
    <div className={`fixed z-50 top-4 inset-x-2 text-foreground text-center py-2 rounded-lg ${typeStyles[type]}`}>
      {typeIcon[type]}
      {message}
    </div>
  );
};
