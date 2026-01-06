import React from 'react';
import { Link } from 'react-router-dom';
import { Alert, Card, CardBody } from '@/components';

interface FaqIntroCardProps {
  note: string;
}

const FaqIntroCard: React.FC<FaqIntroCardProps> = ({ note }) => {
  return (
    <Card padding="lg">
      <CardBody className="space-y-4">
        <Alert type="info" title="Draft">
          {note}
        </Alert>
        <p className="text-sm text-theme-text-secondary">
          Learn about our principles and approach:{' '}
          <Link
            to="/values"
            className="text-theme-interactive-primary hover:text-theme-interactive-primary-hover underline font-medium"
          >
            Values, Mission, and Vision
          </Link>
          .
        </p>
      </CardBody>
    </Card>
  );
};

export default FaqIntroCard;
