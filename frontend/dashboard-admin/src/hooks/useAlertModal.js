import React, { useState } from 'react';
import AlertModal from '../components/shared/AlertModal';

export function useAlertModal() {
  const [state, setState] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const showAlert = ({ type = 'info', title = '', message = '' }) => {
    setState({ isOpen: true, type, title, message });
  };

  const hideAlert = () => {
    setState(prev => ({ ...prev, isOpen: false }));
  };

  const alertModal = React.createElement(AlertModal, {
    isOpen: state.isOpen,
    type: state.type,
    title: state.title,
    message: state.message,
    onClose: hideAlert,
  });

  return { alertModal, showAlert, hideAlert };
}
