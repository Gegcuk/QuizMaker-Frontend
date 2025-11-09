// ---------------------------------------------------------------------------
// ThemeDemoPage.tsx - Demo page showcasing all available color schemes
// Useful for testing and demonstrating the theme system
// ---------------------------------------------------------------------------

import React from 'react';
import { PageContainer } from '@/components';
import { ColorSchemeSelector, Button, Card, CardBody, CardHeader, Input } from '@/components/ui';
import { useTheme } from '@/context/ThemeContext';

const ThemeDemoPage: React.FC = () => {
  const { currentPalette, colorScheme } = useTheme();

  return (
    <PageContainer
      title="Theme System Demo"
      subtitle="Explore different color schemes and see how they affect the interface"
      showBreadcrumb={true}
      showBackButton={true}
      backTo="/"
    >
      <div className="space-y-8">
        {/* Color Scheme Selector */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-theme-text-primary">Choose Your Color Scheme</h3>
          </CardHeader>
          <CardBody>
            <ColorSchemeSelector />
          </CardBody>
        </Card>

        {/* Current Palette Info */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-theme-text-primary">Current Palette: {currentPalette.name}</h3>
          </CardHeader>
          <CardBody>
            <p className="text-theme-text-secondary mb-4">{currentPalette.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-theme-text-primary">Backgrounds</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                      style={{ backgroundColor: currentPalette.colors.bg.primary }}
                    />
                    <span className="text-sm text-theme-text-secondary">Primary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                      style={{ backgroundColor: currentPalette.colors.bg.secondary }}
                    />
                    <span className="text-sm text-theme-text-secondary">Secondary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                      style={{ backgroundColor: currentPalette.colors.bg.tertiary }}
                    />
                    <span className="text-sm text-theme-text-secondary">Tertiary</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-theme-text-primary">Text Colors</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                      style={{ backgroundColor: currentPalette.colors.text.primary }}
                    />
                    <span className="text-sm text-theme-text-secondary">Primary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                      style={{ backgroundColor: currentPalette.colors.text.secondary }}
                    />
                    <span className="text-sm text-theme-text-secondary">Secondary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                      style={{ backgroundColor: currentPalette.colors.text.tertiary }}
                    />
                    <span className="text-sm text-theme-text-secondary">Tertiary</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-theme-text-primary">Interactive</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                      style={{ backgroundColor: currentPalette.colors.interactive.primary }}
                    />
                    <span className="text-sm text-theme-text-secondary">Primary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                      style={{ backgroundColor: currentPalette.colors.interactive.secondary }}
                    />
                    <span className="text-sm text-theme-text-secondary">Secondary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                      style={{ backgroundColor: currentPalette.colors.accent }}
                    />
                    <span className="text-sm text-theme-text-secondary">Accent</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-theme-text-primary">Status Colors</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                      style={{ backgroundColor: currentPalette.colors.interactive.success }}
                    />
                    <span className="text-sm text-theme-text-secondary">Success</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                      style={{ backgroundColor: currentPalette.colors.interactive.warning }}
                    />
                    <span className="text-sm text-theme-text-secondary">Warning</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                      style={{ backgroundColor: currentPalette.colors.interactive.danger }}
                    />
                    <span className="text-sm text-theme-text-secondary">Danger</span>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Component Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-theme-text-primary">Button Variants</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="success">Success</Button>
                  <Button variant="warning">Warning</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="info">Info</Button>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-theme-text-primary">Typography</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-theme-text-primary">Heading 1</h1>
                <h2 className="text-2xl font-semibold text-theme-text-primary">Heading 2</h2>
                <h3 className="text-xl font-medium text-theme-text-primary">Heading 3</h3>
                <p className="text-theme-text-secondary">
                  This is a paragraph with secondary text color. It should be readable and provide good contrast.
                </p>
                <p className="text-theme-text-tertiary text-sm">
                  This is tertiary text, typically used for captions, labels, and less important information.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Form Elements */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-theme-text-primary">Form Elements</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Input
                type="text"
                label="Sample Input"
                placeholder="Type something here..."
                fullWidth
              />
              
              <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-2">
                  Sample Textarea
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-theme-border-primary rounded-md bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-border-focus"
                  rows={3}
                  placeholder="Enter your message..."
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Current Scheme Info */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-theme-text-primary">Current Configuration</h3>
          </CardHeader>
          <CardBody>
            <div className="bg-theme-bg-tertiary p-4 rounded-lg">
              <pre className="text-sm text-theme-text-secondary overflow-x-auto">
                {JSON.stringify({
                  colorScheme: colorScheme,
                  palette: currentPalette.name,
                  colors: currentPalette.colors
                }, null, 2)}
              </pre>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  );
};

export default ThemeDemoPage;
