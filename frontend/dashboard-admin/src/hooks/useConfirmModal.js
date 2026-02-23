import React, { useState } from 'react';
import ConfirmModal from '../components/shared/ConfirmModal';

export function useConfirmModal() {
  const [state, setState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const showConfirm = ({ title = '', message = '', onConfirm }) => {
    setState({ isOpen: true, title, message, onConfirm });
  };

  const hideConfirm = () => {
    setState(prev => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  const handleConfirm = () => {
    state.onConfirm?.();
    hideConfirm();
  };

  const confirmModal = React.createElement(ConfirmModal, {
    isOpen: state.isOpen,
    title: state.title,
    message: state.message,
    onConfirm: handleConfirm,
    onClose: hideConfirm,
  });

  return { confirmModal, showConfirm, hideConfirm };
}
