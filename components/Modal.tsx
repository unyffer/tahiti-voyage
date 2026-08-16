'use client'

// Modal is now a thin wrapper around BottomSheet for backward compatibility
import BottomSheet from '@/components/BottomSheet'

interface ModalProps {
  titre?: string
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ titre, onClose, children }: ModalProps) {
  return (
    <BottomSheet titre={titre} onClose={onClose}>
      {children}
    </BottomSheet>
  )
}
