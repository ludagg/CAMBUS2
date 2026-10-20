'use client';
import React from 'react';
import { Dialog } from './admin/ui';

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Legacy wrapper: every existing form modal now renders in the admin design system. */
const AdminModal: React.FC<Props> = ({ title, onClose, children }) => (
  <Dialog title={title} onClose={onClose}>
    {children}
  </Dialog>
);

export default AdminModal;
