import React from 'react';
import { Form, FormField } from '@/components';
import { commonRules } from '@/utils';

interface QuizFormData {
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: number;
  visibility: string;
}

const QuizCreationForm: React.FC = () => {
  const handleSubmit = async (data: QuizFormData) => {
    console.log('Quiz creation form submitted with data:', data);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate error for demonstration
    if (data.title === 'error') {
      throw new Error('Quiz title already exists');
    }
    
    alert('Quiz created successfully!');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Quiz</h2>
      
      <Form<QuizFormData>
        onSubmit={handleSubmit}
        defaultValues={{
          title: '',
          description: '',
          difficulty: 'MEDIUM',
          estimatedTime: 30,
          visibility: 'PRIVATE'
        }}
        className="space-y-6"
      >
        <FormField
          name="title"
          label="Quiz Title"
          placeholder="Enter quiz title"
          validation={{
            required: true,
            minLength: 3,
            maxLength: 100
          }}
          required
        />
        
        <FormField
          name="description"
          label="Description"
          placeholder="Enter quiz description"
          validation={{
            maxLength: 500
          }}
          helperText="Optional description for your quiz"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="difficulty"
            label="Difficulty"
            validation={{ required: true }}
            required
          />
          
          <FormField
            name="estimatedTime"
            label="Estimated Time (minutes)"
            type="number"
            validation={{
              required: true,
              custom: (value) => {
                const num = parseInt(value);
                return num < 1 ? 'Time must be at least 1 minute' : 
                       num > 300 ? 'Time cannot exceed 300 minutes' : null;
              }
            }}
            required
          />
        </div>
        
        <FormField
          name="visibility"
          label="Visibility"
          validation={{ required: true }}
          required
        />
        
        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex-1 bg-theme-interactive-primary text-theme-text-primary py-2 px-4 rounded-md hover:bg-theme-interactive-primary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary"
          >
            Create Quiz
          </button>
          
          <button
            type="button"
            className="flex-1 bg-theme-bg-tertiary text-theme-text-secondary py-2 px-4 rounded-md hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-theme-focus-ring"
          >
            Cancel
          </button>
        </div>
      </Form>
    </div>
  );
};

export default QuizCreationForm;
