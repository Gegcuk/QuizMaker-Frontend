import { useLayoutEffect, useState } from 'react';
import {
  clearSensitiveReturn,
  readSensitiveReturn,
  type SensitiveReturnValues,
} from './sensitiveReturn';

type ConsumableSensitiveReturnKind = keyof SensitiveReturnValues;

export const useSensitiveReturn = <K extends ConsumableSensitiveReturnKind>(kind: K) => {
  const [record] = useState(() => readSensitiveReturn(kind));

  useLayoutEffect(() => {
    if (record) {
      clearSensitiveReturn(kind, record.capturedAt);
    }
  }, [kind, record]);

  return record?.values ?? null;
};
