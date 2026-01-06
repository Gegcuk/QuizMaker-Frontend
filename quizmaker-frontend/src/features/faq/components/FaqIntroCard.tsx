import React from 'react';
import { Alert, Card, CardBody } from '@/components';

interface FaqIntroCardProps {
  note: string;
}

const FaqIntroCard: React.FC<FaqIntroCardProps> = ({ note }) => {
  return (
    <Card padding="lg">
      <CardBody>
        <Alert type="info" title="Draft">
          {note}
        </Alert>
      </CardBody>
    </Card>
  );
};

export default FaqIntroCard;
