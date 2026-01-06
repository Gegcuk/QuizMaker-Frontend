import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '@/components';
import {
  WindowIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { ImagePlaceholder } from './ImagePlaceholder';

const ValuesSection: React.FC = () => {
  const values = [
    {
      icon: WindowIcon,
      title: 'Transparency and openness',
      description: 'I don\'t like black boxes, and I don\'t build them. Quizzence follows the same principle: I explain decisions, share plans, and invite discussion — especially when something is controversial or uncertain.',
      practice: 'clear reasoning behind changes, an open product direction, honest communication about what works and what still doesn\'t. See our FAQ for direct answers to common questions.',
    },
    {
      icon: BookOpenIcon,
      title: 'Evidence-based thinking',
      description: 'I rely on research and testable methods — while staying realistic: science evolves, and conclusions get refined. Quizzence grows the same way: when the evidence improves, we adjust.',
      practice: 'references where possible, careful wording ("known / likely / still debated"), and updates as the evidence base develops.',
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Flexibility and dialogue',
      description: 'I\'m ready to listen, change my mind, and improve the product alongside users. Quizzence isn\'t a monument — it\'s a tool that should get better through feedback and hypothesis testing.',
      practice: 'feedback turns into real changes, hypotheses are tested, and decisions can be revisited without ego defense. Check our FAQ for answers to questions and updates on features.',
    },
    {
      icon: ArrowTrendingUpIcon,
      title: 'Continuous growth',
      description: 'I see education as one of the strongest levers for quality of life — for individuals and for society. Quizzence exists to make growth more achievable, measurable, and calm (without the performance theater).',
      practice: 'respect for your time, a focus on outcomes, and minimal "busywork".',
    },
  ];

  return (
    <Card padding="lg">
      <CardHeader>
        <h2 className="text-2xl font-bold text-theme-text-primary">Our values (mine — and the project's)</h2>
      </CardHeader>
      <CardBody className="space-y-8">
        {/* Image B: "Less noise — more meaning" signal graphic */}
        <div className="flex justify-center">
          <ImagePlaceholder
            name="Image B: Signal Graphic"
            width={600}
            height={200}
            description="Left: jagged noise signal. Right: clean signal line. Middle: control knob. Small accent on meaning side."
            className="w-full max-w-2xl h-auto rounded-lg border border-theme-border-primary"
            src="/values_signal_graphic.png"
            alt="Signal graphic showing noise reduced to a clean line."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <Card key={index} variant="outlined" padding="md" className="h-full">
                <CardBody className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <Icon className="w-8 h-8 text-theme-interactive-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg font-semibold text-theme-text-primary">
                        {index + 1}) {value.title}
                      </h3>
                      <p className="text-sm text-theme-text-secondary leading-relaxed">
                        {value.description}
                      </p>
                      <p className="text-sm text-theme-text-secondary">
                        <strong className="text-theme-text-primary">In practice:</strong>{' '}
                        {value.practice.includes('FAQ') ? (
                          <>
                            {value.practice.split('FAQ')[0]}
                            <Link
                              to="/faq"
                              className="text-theme-interactive-primary hover:text-theme-interactive-primary-hover underline font-medium"
                            >
                              FAQ
                            </Link>
                            {value.practice.split('FAQ')[1]}
                          </>
                        ) : (
                          value.practice
                        )}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <div className="text-center pt-4">
          <p className="text-lg font-semibold text-theme-text-primary italic">
            Product principle: <span className="text-theme-interactive-primary">Less noise — more meaning.</span>
          </p>
        </div>
      </CardBody>
    </Card>
  );
};

export default ValuesSection;
