import { createContext } from 'react';
import type { GenerationObserver } from '../services/generationObserver';
export const ObserverContext = createContext<GenerationObserver | null>(null);
