"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { Approval } from "@/types";

interface ApprovalModalProps {
  approval: Approval | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  loading?: boolean;
}

export default function ApprovalModal({
  approval,
  isOpen,
  onClose,
  onApprove,
  onReject,
  loading = false,
}: ApprovalModalProps) {
  if (!approval) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={approval.title}>
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">{approval.description}</p>

        <div className="bg-background rounded-xl p-4 border border-border/50">
          <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
            Action Preview
          </p>
          <p className="text-sm text-text-primary whitespace-pre-wrap">
            {approval.actionPreview}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={() => onReject(approval.id)}
            disabled={loading}
            className="flex-1"
          >
            Reject
          </Button>
          <Button
            variant="primary"
            onClick={() => onApprove(approval.id)}
            loading={loading}
            className="flex-1"
          >
            Approve
          </Button>
        </div>
      </div>
    </Modal>
  );
}
