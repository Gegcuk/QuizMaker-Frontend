// src/features/quiz/components/CreateGroupModal.tsx
// ---------------------------------------------------------------------------
// Modal for creating a new quiz group
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { Modal, Button, Input, Textarea } from '@/components';
import { CreateQuizGroupRequest } from '../types/quiz.types';
import ColorPicker from './ColorPicker';
import IconPicker from './IconPicker';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateQuizGroupRequest) => Promise<string>;
  onSuccess?: (groupId: string) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string | undefined>(undefined);
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    if (name.length > 100) {
      setError('Group name must be 100 characters or less');
      return;
    }

    if (description && description.length > 500) {
      setError('Description must be 500 characters or less');
      return;
    }

    setIsCreating(true);
    try {
      const data: CreateQuizGroupRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        color: color || undefined,
        icon: icon || undefined
      };

      const groupId = await onCreate(data);
      if (onSuccess) {
        onSuccess(groupId);
      }
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create group. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setColor(undefined);
    setIcon(undefined);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Group"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-theme-bg-danger border border-theme-border-danger rounded-md p-3 text-sm text-theme-text-danger">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="group-name" className="block text-sm font-medium text-theme-text-primary mb-1">
            Group Name <span className="text-theme-text-danger">*</span>
          </label>
          <Input
            id="group-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Chapter 1, Java Basics"
            maxLength={100}
            required
            disabled={isCreating}
            autoFocus
          />
          <p className="mt-1 text-xs text-theme-text-secondary">
            {name.length}/100 characters
          </p>
        </div>

        <div>
          <Textarea
            id="group-description"
            label={
              <>
                Description <span className="text-theme-text-secondary">(optional)</span>
              </>
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this group..."
            maxLength={500}
            rows={3}
            disabled={isCreating}
            showCharCount={true}
          />
        </div>

        {/* Color and Icon Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <ColorPicker
            value={color}
            onChange={setColor}
          />
          <IconPicker
            value={icon}
            onChange={setIcon}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-theme-border-primary">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isCreating || !name.trim()}
            loading={isCreating}
          >
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateGroupModal;
