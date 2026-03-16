import ConfirmModal from '@/components/common/ConfirmModal';

interface PhoneCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  phone: string;
}

export default function PhoneCallModal({
  isOpen,
  onClose,
  name,
  phone,
}: PhoneCallModalProps) {
  const handleCall = () => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleCall}
      title={name}
      description={phone}
      confirmText="전화 걸기"
      cancelText="취소"
    />
  );
}
