import React from 'react';
import { Form, FormField, Button } from '@/components';
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
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="flex-1"
          >
            Create Quiz
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default QuizCreationForm;
