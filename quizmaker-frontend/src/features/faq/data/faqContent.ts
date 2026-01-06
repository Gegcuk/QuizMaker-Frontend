import type { FaqSection } from '../types/faq.types';

export const faqPageMeta = {
  title: 'Quizzence FAQ',
  subtitle: 'Answers to common questions about Quizzence, quizzes, and learning.',
};

export const faqIntroNote =
  'If something is limited or still rolling out, we say so clearly.';

export const faqSections: FaqSection[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    items: [
      {
        id: 'what-is-quizzence',
        question: 'What is Quizzence?',
        answer: [
          {
            type: 'paragraph',
            content:
              'Quizzence is a web app for creating, managing, and taking quizzes with optional AI quiz generation from text or documents. Learn more about our <a href="/values" class="text-theme-interactive-primary hover:text-theme-interactive-primary-hover underline">values, mission, and vision</a>.',
          },
        ],
      },
      {
        id: 'who-is-quizzence-for',
        question: 'Who is Quizzence for?',
        answer: [
          {
            type: 'paragraph',
            content:
              'Teachers, learners, and anyone studying for exams or certifications - basically anyone who wants a practical way to remember things.',
          },
        ],
      },
      {
        id: 'do-quizzes-help-you-learn',
        question: 'Do quizzes actually help you learn?',
        answer: [
          {
            type: 'paragraph',
            content:
              'Yes. Practice testing (also called retrieval practice) is one of the most consistently supported learning methods in research, and it often beats re-reading for long-term retention.',
          },
          {
            type: 'paragraph',
            content:
              'Studies often show up to about a 13% higher score on delayed tests when retrieval practice is used well compared with studying alone.',
          },
        ],
        note: {
          title: 'Learning note',
          content:
            'A quiz is not only an assessment - it is a learning event. The attempt is where memory gets stronger, not just where it gets measured.',
        },
      },
      {
        id: 'improve-exam-scores',
        question: 'Can it really improve exam scores (like "up to ~13%")?',
        answer: [
          {
            type: 'paragraph',
            content:
              'It can. Results vary, but there are studies showing around 13% higher scores on delayed tests with retrieval practice versus studying alone.',
          },
        ],
        note: {
          title: 'Learning note',
          content:
            'Treat numbers like this as what is possible in a good setup, not a guarantee. The quality of questions, feedback, and spacing matters a lot.',
        },
      },
      {
        id: 'need-account',
        question: 'Do I need an account to use Quizzence?',
        answer: [
          {
            type: 'paragraph',
            content:
              'You can browse public pages (home, blog, terms, privacy). Quiz details, attempts, creating quizzes, profile, and billing require an account.',
          },
        ],
      },
      {
        id: 'public-quiz-anon',
        question: 'If I make a quiz "public", can anyone open it without logging in?',
        answer: [
          {
            type: 'paragraph',
            content:
              'Not yet. Public is about visibility in the product, but anonymous access is not a main flow at the moment.',
          },
        ],
      },
      {
        id: 'where-start',
        question: 'Where should I start after signing up?',
        answer: [
          {
            type: 'paragraph',
            content: 'Start here:',
          },
          {
            type: 'list',
            items: [
              'My Quizzes - see what you have created or own.',
              'Create Quiz - make your first one quickly.',
              'My Attempts - continue a paused attempt or review results.',
            ],
          },
        ],
        note: {
          title: 'Learning note',
          content:
            'The fastest learning win is: create a tiny quiz, attempt it, review mistakes, then repeat tomorrow.',
        },
      },
      {
        id: 'mobile-app',
        question: 'Is Quizzence a mobile app?',
        answer: [
          {
            type: 'paragraph',
            content: 'Currently it is a web app you use in your browser.',
          },
        ],
      },
    ],
  },
  {
    id: 'accounts-access',
    title: 'Accounts and access',
    items: [
      {
        id: 'signup-email',
        question: 'Can I sign up with email and password?',
        answer: [
          {
            type: 'paragraph',
            content: 'Yes. Standard sign-up, login, logout, and password reset are supported.',
          },
        ],
      },
      {
        id: 'verify-emails',
        question: 'Do you verify emails?',
        answer: [
          {
            type: 'paragraph',
            content: 'Yes. There is an email verification flow, including resend support.',
          },
        ],
      },
      {
        id: 'forgot-password',
        question: 'I forgot my password. What do I do?',
        answer: [
          {
            type: 'paragraph',
            content: 'Use "Forgot password", get a reset link, and set a new password.',
          },
        ],
      },
      {
        id: 'social-login',
        question: 'Can I sign in with Google (or other providers)?',
        answer: [
          {
            type: 'paragraph',
            content: 'Yes. Social login and account linking are supported.',
          },
        ],
      },
    ],
  },
  {
    id: 'quizzes',
    title: 'Quizzes: creating, editing, publishing',
    items: [
      {
        id: 'create-quiz',
        question: 'How do I create a quiz?',
        answer: [
          {
            type: 'paragraph',
            content:
              'Use the quiz creation wizard: choose manual / from text / from document, set quiz details, add or generate questions, then finish.',
          },
        ],
      },
      {
        id: 'edit-quiz',
        question: 'Can I edit a quiz after creating it?',
        answer: [
          {
            type: 'paragraph',
            content: 'Yes. You can edit quiz details and manage questions.',
          },
        ],
      },
      {
        id: 'quiz-statuses',
        question: 'What quiz statuses exist?',
        answer: [
          {
            type: 'paragraph',
            content:
              'The core statuses are Draft, Published, and Archived. Additional moderation-like statuses exist too.',
          },
        ],
      },
      {
        id: 'quiz-visibility',
        question: 'What visibility options exist?',
        answer: [
          {
            type: 'paragraph',
            content: 'Public or Private.',
          },
        ],
      },
      {
        id: 'timer-repetition',
        question: 'Can I add a timer or repetition rules?',
        answer: [
          {
            type: 'paragraph',
            content: 'Yes. Quizzes can support timers and repetition-style settings.',
          },
        ],
        note: {
          title: 'Learning note',
          content:
            'Repetition works best when it is spaced. Even simple "retry later" habits can beat cramming.',
        },
      },
      {
        id: 'public-directory',
        question: 'Is there a public directory of quizzes?',
        answer: [
          {
            type: 'paragraph',
            content: 'Not yet as a primary user feature.',
          },
        ],
      },
    ],
  },
  {
    id: 'quiz-groups',
    title: 'Groups: organizing quizzes',
    items: [
      {
        id: 'groups-what',
        question: 'What are quiz groups?',
        answer: [
          {
            type: 'paragraph',
            content:
              'Groups are folders for your quizzes inside My Quizzes. A quiz can belong to multiple groups.',
          },
          {
            type: 'paragraph',
            content:
              'In Groups view, anything not assigned to a group appears under "Ungrouped."',
          },
        ],
      },
      {
        id: 'groups-where',
        question: 'Where do I see groups?',
        answer: [
          {
            type: 'paragraph',
            content:
              'Go to My Quizzes and switch to Groups view using the view toggle. On desktop you can choose grid, list, or groups; on mobile it is tiles or groups.',
          },
          {
            type: 'paragraph',
            content:
              'Expand a group to see its quizzes. Empty groups still appear and show an empty state.',
          },
        ],
      },
      {
        id: 'groups-create',
        question: 'How do I create a group?',
        answer: [
          {
            type: 'paragraph',
            content:
              'In My Quizzes, switch to Groups view and click "Create Group." You can also open a quiz menu (three dots) and choose "Create New Group."',
          },
          {
            type: 'paragraph',
            content:
              'A name is required, and you can optionally add a description, color, and icon.',
          },
        ],
      },
      {
        id: 'groups-add-remove',
        question: 'How do I add or remove quizzes from groups?',
        answer: [
          {
            type: 'paragraph',
            content:
              'Open a quiz menu (three dots), go to Groups, and toggle the checkbox for each group.',
          },
          {
            type: 'paragraph',
            content:
              'You can also select multiple quizzes and use "Add to Group" to place them together in one action.',
          },
        ],
      },
      {
        id: 'groups-delete',
        question: 'What happens if I delete a group?',
        answer: [
          {
            type: 'paragraph',
            content:
              'Deleting a group removes only the group. Your quizzes are not deleted and remain in your library.',
          },
          {
            type: 'paragraph',
            content:
              'If a quiz is not in any other group, it shows under "Ungrouped" afterward.',
          },
        ],
      },
    ],
  },
  {
    id: 'ai-generation',
    title: 'AI quiz generation',
    items: [
      {
        id: 'generate-from-what',
        question: 'What can I generate a quiz from?',
        answer: [
          {
            type: 'paragraph',
            content: 'You can generate quizzes from pasted text or an uploaded document.',
          },
        ],
      },
      {
        id: 'generate-from-link',
        question: 'Can I generate from a link or URL?',
        answer: [
          {
            type: 'paragraph',
            content:
              'The landing copy mentions links, but link-based generation is not implemented in the main UI flow yet.',
          },
        ],
      },
      {
        id: 'ai-question-types',
        question: 'What types of questions can AI generate?',
        answer: [
          {
            type: 'paragraph',
            content:
              'A mix of formats like multiple choice, true/false, fill-the-gap, ordering, matching, and more (depending on the generation flow).',
          },
        ],
      },
      {
        id: 'ai-perfect',
        question: 'Will AI-generated questions be perfect?',
        answer: [
          {
            type: 'paragraph',
            content:
              'Not always. Expect to review and adjust wording, correct answers, and difficulty.',
          },
        ],
        note: {
          title: 'Learning note',
          content:
            'Even almost-right questions can still be valuable if you review mistakes immediately after and fix misunderstandings.',
        },
      },
      {
        id: 'token-cost',
        question: 'Can I see the token cost before generating?',
        answer: [
          {
            type: 'paragraph',
            content: 'Yes. The wizard shows a token cost estimate before you start generation.',
          },
        ],
      },
    ],
  },
  {
    id: 'questions-bank',
    title: 'Questions',
    items: [
      {
        id: 'question-types',
        question: 'What question types does Quizzence support?',
        answer: [
          {
            type: 'paragraph',
            content:
              'Multiple choice (single or multi), true/false, open questions, fill gap, ordering, matching, hotspot, and more.',
          },
        ],
      },
      {
        id: 'hints-explanations',
        question: 'Can questions include explanations or hints?',
        answer: [
          {
            type: 'paragraph',
            content: 'Yes. Hints and explanations are supported, and they are great for learning.',
          },
        ],
        note: {
          title: 'Learning note',
          content:
            'Explanations are one of the best ROI features in a quiz system: they turn an error into a lesson.',
        },
      },
    ],
  },
  {
    id: 'attempts',
    title: 'Attempts: taking quizzes, pausing, reviewing',
    items: [
      {
        id: 'attempt-definition',
        question: 'What is an attempt?',
        answer: [
          {
            type: 'paragraph',
            content: 'It is one run of a quiz - your answers, timing (if relevant), and results.',
          },
        ],
      },
      {
        id: 'pause-resume',
        question: 'Can I pause and resume a quiz?',
        answer: [
          {
            type: 'paragraph',
            content: 'Yes. Attempts support pausing and resuming.',
          },
        ],
      },
      {
        id: 'attempt-modes',
        question: 'What attempt modes exist?',
        answer: [
          {
            type: 'paragraph',
            content: 'Options include question-by-question, all-at-once, and timed modes.',
          },
        ],
      },
      {
        id: 'review-important',
        question: 'Why is review so important?',
        answer: [
          {
            type: 'paragraph',
            content:
              'Retrieval practice works best when it includes feedback. Research in medical education and broader learning science consistently shows better long-term retention with repeated testing plus feedback than with repeated study.',
          },
        ],
      },
    ],
  },
  {
    id: 'exporting-printing',
    title: 'Exporting and printing',
    items: [
      {
        id: 'export-quizzes',
        question: 'Can I export quizzes?',
        answer: [
          {
            type: 'paragraph',
            content: 'Yes. Exports include printable and editable formats (PDF, HTML, XLSX, JSON).',
          },
        ],
      },
      {
        id: 'export-answers',
        question: 'Can exports include answers and explanations?',
        answer: [
          {
            type: 'paragraph',
            content:
              'Yes. Export options can include answer keys, hints, explanations, and other helpful extras.',
          },
        ],
      },
    ],
  },
  {
    id: 'analytics-progress',
    title: 'Analytics and progress',
    items: [
      {
        id: 'analytics-available',
        question: 'Do quizzes have analytics?',
        answer: [
          {
            type: 'paragraph',
            content:
              'Yes. Analytics can show patterns like score distribution, question performance, and attempt trends.',
          },
        ],
      },
      {
        id: 'analytics-final',
        question: 'Is everything in analytics final?',
        answer: [
          {
            type: 'paragraph',
            content:
              'Some analytics views are still evolving, and some charts may be approximations while features mature.',
          },
        ],
      },
    ],
  },
  {
    id: 'billing-tokens',
    title: 'Billing, tokens, and payments',
    items: [
      {
        id: 'what-are-tokens',
        question: 'What are tokens?',
        answer: [
          {
            type: 'paragraph',
            content: 'Tokens are the unit used for AI-powered actions like generating quizzes from content.',
          },
        ],
      },
      {
        id: 'need-tokens',
        question: 'Do I need tokens to use Quizzence?',
        answer: [
          {
            type: 'paragraph',
            content:
              'For AI generation, yes. For taking quizzes and reviewing attempts, you can still do a lot without spending tokens.',
          },
        ],
      },
      {
        id: 'buy-tokens',
        question: 'How do I buy tokens?',
        answer: [
          {
            type: 'paragraph',
            content: 'You buy token packs via checkout (Stripe).',
          },
        ],
      },
      {
        id: 'why-tokens',
        question: 'Why tokens instead of subscriptions?',
        answer: [
          {
            type: 'paragraph',
            content:
              'We chose tokens because they feel fairer and simpler for most learners. Subscriptions can be great for businesses, but as the founder of Quizzence, I (Aleksei Lazunin) honestly do not like them as a user - paying every month "just in case" I study is frustrating.',
          },
          {
            type: 'paragraph',
            content:
              'With tokens, you pay for what you actually use. If you are busy for a week (or a month), you do not feel like you are wasting money.',
          },
          {
            type: 'paragraph',
            content:
              'It also makes costs more transparent: AI generation has a real per-use cost, and tokens let us show that clearly.',
          },
          {
            type: 'subheading',
            content: 'Pros of tokens',
          },
          {
            type: 'list',
            items: [
              'Pay-as-you-go: spend only when you generate quizzes or use AI features.',
              'No guilt, no pressure: you can pause learning without losing a monthly fee.',
              'Clear value per action: easier to understand what you are paying for.',
              'Works for irregular study habits: perfect for exam bursts and quiet months.',
            ],
          },
          {
            type: 'subheading',
            content: 'Trade-offs (we are honest about these)',
          },
          {
            type: 'list',
            items: [
              'More decisions: you occasionally think about balance instead of "it is included."',
              'Harder to predict monthly spend if you generate a lot at once.',
              'Not ideal for heavy daily users, where a subscription can be cheaper.',
            ],
          },
          {
            type: 'paragraph',
            content:
              'Our goal is to keep Quizzence aligned with real learning behavior: people study in waves. Tokens fit that reality better than a recurring charge.',
          },
        ],
      },
      {
        id: 'available-vs-reserved',
        question: "What is the difference between available and reserved tokens?",
        answer: [
          {
            type: 'paragraph',
            content:
              'Reserved tokens are temporarily held for in-progress operations so they can complete smoothly.',
          },
        ],
      },
      {
        id: 'billing-history',
        question: 'Can I see my billing history?',
        answer: [
          {
            type: 'paragraph',
            content: 'Yes. Transaction history is available.',
          },
        ],
      },
    ],
  },
  {
    id: 'profile-settings',
    title: 'Profile and settings',
    items: [
      {
        id: 'profile-details',
        question: 'What profile details can I edit?',
        answer: [
          {
            type: 'paragraph',
            content: 'Basic account and profile details (like name or display info) and verification actions.',
          },
        ],
      },
      {
        id: 'settings-persist',
        question: 'Do settings (notifications, privacy, preferences) save right now?',
        answer: [
          {
            type: 'paragraph',
            content:
              'Some settings pages exist but may not persist changes yet (still being wired up).',
          },
        ],
      },
    ],
  },
  {
    id: 'support-troubleshooting',
    title: 'Support and troubleshooting',
    items: [
      {
        id: 'report-bug',
        question: 'How do I report a bug?',
        answer: [
          {
            type: 'paragraph',
            content: 'Use the in-app "Found a bug?" entry to send a report.',
          },
        ],
      },
      {
        id: 'not-working',
        question: 'Something is not working. What should I try first?',
        answer: [
          {
            type: 'list',
            items: [
              'Refresh the page.',
              'Log out and log back in.',
              'Confirm email verification.',
              'Try again.',
              'Then report the bug with steps and screenshots.',
            ],
          },
        ],
      },
      {
        id: 'unfinished-pages',
        question: 'Why do some pages feel unfinished?',
        answer: [
          {
            type: 'paragraph',
            content:
              'A few areas are known placeholders or are still being connected properly (for example: some analytics and some user pages).',
          },
        ],
      },
    ],
  },
  {
    id: 'glossary',
    title: 'Glossary',
    items: [
      {
        id: 'glossary-quiz',
        question: 'What is a quiz?',
        answer: [
          {
            type: 'paragraph',
            content: 'A set of questions plus settings like visibility and status.',
          },
        ],
      },
      {
        id: 'glossary-attempt',
        question: 'What is an attempt?',
        answer: [
          {
            type: 'paragraph',
            content: 'One quiz-taking session that can be paused or resumed.',
          },
        ],
      },
      {
        id: 'glossary-document',
        question: 'What is a document?',
        answer: [
          {
            type: 'paragraph',
            content: 'Your uploaded material used for search and quiz generation.',
          },
        ],
      },
      {
        id: 'glossary-token',
        question: 'What is a token?',
        answer: [
          {
            type: 'paragraph',
            content: 'The billing unit for AI features.',
          },
        ],
      },
    ],
  },
];
