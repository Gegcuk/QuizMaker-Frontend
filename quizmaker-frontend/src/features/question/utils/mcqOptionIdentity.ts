import type { McqOption } from '../types/question.types';

const getOptionIdKey = (id: unknown) => (
  typeof id === 'string' ? id.trim().toLowerCase() : ''
);

const getNextIdFromKeys = (usedKeys: ReadonlySet<string>): string => {
  for (let code = 'a'.charCodeAt(0); code <= 'z'.charCodeAt(0); code += 1) {
    const candidate = String.fromCharCode(code);
    if (!usedKeys.has(candidate)) return candidate;
  }

  let suffix = 1;
  while (usedKeys.has(`option-${suffix}`)) suffix += 1;
  return `option-${suffix}`;
};

export const getNextMcqOptionId = (
  options: ReadonlyArray<{ id?: unknown }>,
): string => getNextIdFromKeys(new Set(options.map((option) => getOptionIdKey(option.id))));

export const ensureUniqueMcqOptionIds = (options: McqOption[]): McqOption[] => {
  const usedKeys = new Set<string>();

  return options.map((option) => {
    const candidate = typeof option.id === 'string' ? option.id.trim() : '';
    const candidateKey = getOptionIdKey(candidate);
    const id = candidate && !usedKeys.has(candidateKey)
      ? candidate
      : getNextIdFromKeys(usedKeys);

    usedKeys.add(getOptionIdKey(id));
    return id === option.id ? option : { ...option, id };
  });
};

export const hasUniqueMcqOptionIds = (
  options: ReadonlyArray<{ id?: unknown }>,
): boolean => {
  const keys = options.map((option) => getOptionIdKey(option.id));
  return keys.every(Boolean) && new Set(keys).size === keys.length;
};
