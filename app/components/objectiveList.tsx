'use client';

import clsx from 'clsx/lite';
import { useEffect, useRef, forwardRef, ForwardedRef, useImperativeHandle, useState } from 'react';

type ObjectiveListProps = {
  objectives: string[];
  setObjectives: React.Dispatch<React.SetStateAction<string[]>>;
  maxObjectives: number;
};

const ObjectiveList = forwardRef(
  ({ objectives, setObjectives, maxObjectives }: ObjectiveListProps, forwardedRef: ForwardedRef<HTMLInputElement>) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const prevObjectivesLength = useRef(objectives.length);
    const [errorMessages, setErrorMessages] = useState<(string | null)[]>([]);
    const [errorIndex, setErrorIndex] = useState(0);

    useEffect(() => {
      if (objectives.length !== prevObjectivesLength.current) {
        const focusIndex =
          objectives.length > prevObjectivesLength.current
            ? objectives.length - 1 // Add : focus new point
            : Math.min(objectives.length - 1, prevObjectivesLength.current - 1); // Delete : focus last existing

        setTimeout(() => {
          inputRefs.current[focusIndex]?.focus();
        }, 10);

        // Reset error messages when objectives change
        setErrorMessages(Array(objectives.length).fill(null));
      }
      prevObjectivesLength.current = objectives.length;
    }, [objectives.length]);

    // Check if an objective would create a duplicate
    const isDuplicate = (value: string, index: number) => {
      const trimmedValue = value.trim();
      if (trimmedValue === '') return false;

      return objectives.some((obj, i) => i !== index && obj.trim() === trimmedValue);
    };

    const addObjective = () => {
      // Prevent adding more than 10 points
      if (objectives.length >= maxObjectives) {
        return;
      }

      const lastIndex = objectives.length - 1;
      const lastObjective = objectives[lastIndex];

      // Check if last objective is empty
      if (lastObjective?.trim() === '') return;

      // Check for duplicates before adding
      if (isDuplicate(lastObjective, lastIndex)) {
        // Set error message for the last objective
        const newErrors = [...errorMessages];
        newErrors[lastIndex] = 'Cet objectif existe déjà';
        setErrorMessages(newErrors);
        setErrorIndex(lastIndex);

        return;
      }

      // If we reach here, we can add a new objective
      setObjectives([...objectives, '']);
      setErrorMessages([...errorMessages, null]);
      setErrorIndex(0);
    };

    const editObjective = (index: number, valeur: string) => {
      // Always update the objective text - we'll check for duplicates on submit/add
      const newObjectives = [...objectives];
      newObjectives[index] = valeur;
      setObjectives(newObjectives);

      // Check for duplicates when editing otherwise clear error
      const hasDuplicate = isDuplicate(valeur, index);
      const newErrors = [...errorMessages];
      newErrors[index] = hasDuplicate ? 'Cet objectif existe déjà' : null;
      setErrorMessages(newErrors);
      setErrorIndex(hasDuplicate ? index : 0);
    };

    const deleteObjective = (index: number) => {
      if (objectives.length === 1) {
        const newObjectives = [...objectives];
        newObjectives[0] = '';
        setObjectives(newObjectives);
      } else {
        setObjectives(objectives.filter((_, i) => i !== index));
      }
    };

    // Forward the ref to the last input element in the component
    useImperativeHandle(forwardedRef, () => {
      // Get the index of the last element
      const lastIndex = objectives.length - 1;
      const index = errorIndex < lastIndex ? errorIndex : lastIndex;

      // When the ref is accessed and the last inputRef is null, we need to handle that case
      // This is a workaround for TypeScript type checking with forwardRef
      if (!inputRefs.current[index]) {
        // Return a minimal implementation of HTMLInputElement when null
        return {
          focus: () => {
            // Try to focus the last input when it becomes available
            setTimeout(() => {
              const index = inputRefs.current.length - 1;
              if (inputRefs.current[index]) inputRefs.current[index].focus();
            }, 0);
          },
        } as unknown as HTMLInputElement;
      }
      return inputRefs.current[index];
    });

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-base font-medium text-foreground">Objectifs</h2>
          {(objectives.length === 0 || objectives[objectives.length - 1]?.trim() !== '') &&
            objectives.length < maxObjectives && (
              <button
                type="button"
                onClick={addObjective}
                className="text-sm bg-foreground/10 text-foreground px-3 rounded-md hover:bg-foreground/20 transition-colors"
              >
                + Ajouter
              </button>
            )}
          {objectives.length >= maxObjectives && <span className="text-sm text-orange-500">Maximum atteint</span>}
        </div>

        {objectives.map((objective, index) => (
          <div
            key={index}
            className="flex flex-col w-full transition-all animate-in fade-in slide-in-from-bottom-4 duration-200"
          >
            <div className="flex gap-2 items-center w-full">
              <input
                type="text"
                value={objective}
                onChange={e => editObjective(index, e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    // If this is the last objective, add a new one
                    if (index === objectives.length - 1) {
                      addObjective(); // The addObjective function will handle duplicate checking
                    } else {
                      // Otherwise, move focus to the next objective
                      inputRefs.current[index + 1]?.focus();
                    }
                  } else if (e.key === 'Backspace' && objective === '') {
                    deleteObjective(index);
                    e.preventDefault();
                  }
                }}
                // className="flex-1 px-3 py-2 border rounded-lg bg-background text-foreground border-foreground/20 focus:ring-2 focus:ring-foreground/50"
                placeholder="Description de la tâche"
                ref={el => {
                  if (el) inputRefs.current[index] = el;
                }}
                className={clsx(
                  'flex-1 px-3 py-2 rounded-lg bg-background text-foreground',
                  errorMessages[index]
                    ? 'border-red-500 focus-visible:outline-red-500 border-2'
                    : 'border-foreground/20 focus-visible:outline-primary border',
                )}
              />
              {(objectives.length > 1 || objective !== '') && (
                <button
                  type="button"
                  onClick={() => deleteObjective(index)}
                  className="text-red-500 hover:text-red-600 px-3 text-3xl rounded-md"
                  aria-label="Supprimer"
                >
                  ×
                </button>
              )}
            </div>
            {errorMessages[index] && <p className="text-red-500 text-sm mt-1 ml-1">{errorMessages[index]}</p>}
          </div>
        ))}
      </div>
    );
  },
);

// Add display name for better debugging
ObjectiveList.displayName = 'ObjectiveList';

export default ObjectiveList;
