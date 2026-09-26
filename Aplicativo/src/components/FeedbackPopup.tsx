import { useEffect, useState } from 'react';
import './FeedbackPopup.css';

export type FeedbackType = 'success' | 'error' | 'info';

interface FeedbackPopupProps {
  message: string;
  type: FeedbackType;
  visible: boolean;
  onClose: () => void;
  /** Duração em ms antes de auto-fechar. Padrão: 4000ms */
  duration?: number;
}

/**
 * Componente de Pop-up/Toast customizado seguindo o design escuro do app.
 * Exibe mensagens de sucesso, erro e info com auto-dismiss.
 */
export function FeedbackPopup({
  message,
  type,
  visible,
  onClose,
  duration = 4000,
}: FeedbackPopupProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setIsExiting(false);

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300); // aguarda animação de saída
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  if (!visible && !isExiting) return null;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

  return (
    <div className={`feedback-popup feedback-${type} ${isExiting ? 'feedback-exit' : ''}`}>
      <span className="feedback-icon">{icon}</span>
      <span className="feedback-message">{message}</span>
      <button className="feedback-close" onClick={() => { setIsExiting(true); setTimeout(onClose, 300); }}>
        ✕
      </button>
    </div>
  );
}
