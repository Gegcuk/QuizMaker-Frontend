// src/pages/QuizFormPage.tsx
// ---------------------------------------------------------------------------
// Handles BOTH “create”  (/quizzes/create)
// and “edit”   (/quizzes/:quizId/edit) quiz workflows.
// ---------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import {
  useParams,
  useNavigate,
} from 'react-router-dom';
import Spinner from '../components/Spinner';
import {
  CategoryDto,
  TagDto,
  QuizDto,
  CreateQuizRequest,
  UpdateQuizRequest,
} from '../types/api';

// Service helpers ------------------------------------------------------------
import {
  getQuizById,
  createQuiz,
  updateQuiz,
} from '../api/quiz.service';
import { getAllCategories } from '../api/category.service';
import { getAllTags } from '../api/tag.service';

interface QuizFormPageProps {
  mode: 'create' | 'edit';
}

const QuizFormPage: React.FC<QuizFormPageProps> = ({ mode }) => {
  /* ---------------------------------------------------------------------- */
  /*  Routing                                                               */
  /* ---------------------------------------------------------------------- */
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  /* ---------------------------------------------------------------------- */
  /*  Form state                                                            */
  /* ---------------------------------------------------------------------- */
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [visibility, setVisibility] =
    useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');
  const [difficulty, setDifficulty] =
    useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [estimatedTime, setEstimatedTime] = useState<number>(10);
  const [timerEnabled, setTimerEnabled] = useState<boolean>(false);
  const [timerDuration, setTimerDuration] = useState<number>(5);
  const [categoryId, setCategoryId] = useState<string>('');
  const [tagIds, setTagIds] = useState<string[]>([]);

  // Lists from API
  const [allCategories, setAllCategories] = useState<CategoryDto[]>([]);
  const [allTags, setAllTags] = useState<TagDto[]>([]);

  // UX flags
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------------------------------------------------------------- */
  /*  Fetch categories, tags, and (in edit) quiz data                       */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
        // 1. categories & tags in parallel
        const [catsRes, tagsRes] = await Promise.all([
          getAllCategories({ page: 0, size: 100 }),
          getAllTags({ page: 0, size: 100 }),
        ]);
        setAllCategories(catsRes.data.content);
        setAllTags(tagsRes.data.content);

        // 2. quiz details if edit mode
        if (mode === 'edit' && quizId) {
          const { data } = await getQuizById<QuizDto>(quizId);
          // pre-fill form
          setTitle(data.title);
          setDescription(data.description ?? '');
          setVisibility(data.visibility);
          setDifficulty(data.difficulty);
          setEstimatedTime(data.estimatedTime);
          setTimerEnabled(data.timerEnabled);
          setTimerDuration(data.timerDuration ?? 5);
          setCategoryId(data.categoryId ?? '');
          setTagIds(data.tagIds ?? []);
        }
      } catch (e: any) {
        setError(
          e?.response?.data?.error ||
            (mode === 'edit'
              ? 'Failed to load quiz.'
              : 'Failed to load reference data.'),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mode, quizId]);

  /* ---------------------------------------------------------------------- */
  /*  Client-side validation helper                                         */
  /* ---------------------------------------------------------------------- */
  const validate = (): string | null => {
    if (title.trim().length < 3 || title.trim().length > 100) {
      return 'Title must be between 3 and 100 characters.';
    }
    if (estimatedTime < 1 || estimatedTime > 180) {
      return 'Estimated time must be between 1 and 180 minutes.';
    }
    if (timerEnabled && (timerDuration < 1 || timerDuration > 180)) {
      return 'Timer duration must be between 1 and 180 minutes.';
    }
    return null;
  };

  /* ---------------------------------------------------------------------- */
  /*  Submit handler                                                        */
  /* ---------------------------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Build payload --------------------------------------------------------
    const payloadBase = {
      title: title.trim(),
      description: description.trim() || undefined,
      visibility,
      difficulty,
      estimatedTime,
      timerEnabled,
      timerDuration: timerEnabled ? timerDuration : undefined,
      categoryId: categoryId || undefined,
      tagIds: tagIds.length ? tagIds : [],
    };

    setSubmitting(true);
    setError(null);

    try {
      if (mode === 'create') {
        const { data } = await createQuiz<QuizDto>(
          payloadBase as CreateQuizRequest,
        );
        navigate(`/quizzes/${data.id}`);
      } else if (quizId) {
        await updateQuiz(quizId, payloadBase as UpdateQuizRequest);
        navigate(`/quizzes/${quizId}`);
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.error ||
          'Failed to save quiz. Please check fields and try again.',
      );
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */
  if (loading) return <Spinner />;

  return (
    <div className="max-w-2xl mx-auto p-4 border rounded">
      <h2 className="text-2xl font-semibold mb-4">
        {mode === 'create' ? 'Create New Quiz' : 'Edit Quiz'}
      </h2>

      {error && <div className="text-red-500 mb-2">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title ---------------------------------------------------------- */}
        <div>
          <label htmlFor="title" className="block mb-1">
            Title *
          </label>
          <input
            id="title"
            type="text"
            required
            minLength={3}
            maxLength={100}
            className="w-full border px-3 py-2 rounded"
            value={title}
            disabled={submitting}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description ---------------------------------------------------- */}
        <div>
          <label htmlFor="description" className="block mb-1">
            Description
          </label>
          <textarea
            id="description"
            className="w-full border px-3 py-2 rounded"
            rows={3}
            maxLength={1000}
            disabled={submitting}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Visibility & Difficulty --------------------------------------- */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="visibility" className="block mb-1">
              Visibility
            </label>
            <select
              id="visibility"
              value={visibility}
              disabled={submitting}
              onChange={(e) =>
                setVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')
              }
              className="w-full border px-3 py-2 rounded"
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="difficulty" className="block mb-1">
              Difficulty
            </label>
            <select
              id="difficulty"
              value={difficulty}
              disabled={submitting}
              onChange={(e) =>
                setDifficulty(e.target.value as 'EASY' | 'MEDIUM' | 'HARD')
              }
              className="w-full border px-3 py-2 rounded"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
        </div>

        {/* Estimated Time & Timer ---------------------------------------- */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="estimatedTime" className="block mb-1">
              Estimated Time (minutes) *
            </label>
            <input
              id="estimatedTime"
              type="number"
              required
              min={1}
              max={180}
              disabled={submitting}
              className="w-full border px-3 py-2 rounded"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(Number(e.target.value))}
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1">Timer Enabled</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={timerEnabled}
                disabled={submitting}
                onChange={(e) => setTimerEnabled(e.target.checked)}
                className="mr-2"
              />
              {timerEnabled && (
                <>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    className="border px-2 py-1 rounded w-20"
                    disabled={submitting}
                    value={timerDuration}
                    onChange={(e) => setTimerDuration(Number(e.target.value))}
                  />
                  <span className="ml-2 text-sm">minutes</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Category ------------------------------------------------------- */}
        <div>
          <label htmlFor="categoryId" className="block mb-1">
            Category
          </label>
          <select
            id="categoryId"
            value={categoryId}
            disabled={submitting}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select Category</option>
            {allCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags ---------------------------------------------------------- */}
        <div>
          <label htmlFor="tagIds" className="block mb-1">
            Tags (Ctrl / Cmd + Click)
          </label>
          <select
            id="tagIds"
            multiple
            disabled={submitting}
            value={tagIds}
            onChange={(e) =>
              setTagIds(Array.from(e.target.selectedOptions, (o) => o.value))
            }
            className="w-full border px-3 py-2 rounded h-32"
          >
            {allTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons ------------------------------------------------------- */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
          >
            {submitting
              ? 'Saving…'
              : mode === 'create'
              ? 'Create Quiz'
              : 'Save Changes'}
          </button>
          <button
            type="button"
            disabled={submitting}
            className="px-6 py-2 border rounded"
            onClick={() => navigate('/quizzes')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizFormPage;
