'use client';

import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { fetchConciergerieByName, updateConciergerieWithUserId } from '../actions/conciergerie';
import LoadingSpinner from '../components/loadingSpinner';
import { useAuth } from '../contexts/authProvider';

export default function IdPage({ params }: { params: Promise<{ id: string }> }) {
  // Use React.use to unwrap the params promise
  const { userId, refreshUserData, selectedConciergerieName } = useAuth();
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const router = useRouter();

  const [isUpdating, setIsUpdating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateAndUpdateConciergerie = async () => {
      try {
        setIsUpdating(true);

        // Check if the ID in the URL matches the ID in localStorage AND that there is a selected conciergerie in localStorage
        if (!userId || userId !== id || !selectedConciergerieName) {
          console.log('ID mismatch or no selected conciergerie, redirecting to landing page');
          router.push('/');
          return;
        }

        // Fetch from the database the ID of the conciergerie whose name is stored in localStorage
        const conciergerie = await fetchConciergerieByName(selectedConciergerieName);

        if (!conciergerie) {
          console.error('Conciergerie not found');
          setError('Conciergerie non trouvée');
          router.push('/');
          return;
        }

        // If the ID fetched is the one in the localStorage, do nothing
        if (conciergerie.id === userId) {
          console.log('Conciergerie ID already matches user ID');
          router.push('/missions');
          return;
        }

        // If the ID fetched is not the one in the localStorage, update it in the database
        const result = await updateConciergerieWithUserId(id, selectedConciergerieName);

        if (result.success) {
          // Refresh user data to update the auth context
          await refreshUserData();

          // Redirect to missions page
          router.push('/missions');
        } else {
          setError(result.message || 'Une erreur est survenue lors de la mise à jour de la conciergerie');
        }
      } catch (error) {
        console.error('Error validating or updating conciergerie:', error);
        setError('Une erreur est survenue lors de la validation ou de la mise à jour de la conciergerie');
      } finally {
        setIsUpdating(false);
      }
    };

    validateAndUpdateConciergerie();
  }, [id, router, refreshUserData, userId, selectedConciergerieName]);

  if (isUpdating) {
    return (
      <div className="min-h-[calc(100dvh-9rem)] flex items-center justify-center bg-background">
        <LoadingSpinner size="large" text="Mise à jour de l'authentification..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100dvh-9rem)] flex flex-col items-center justify-center bg-background">
        <div className="text-red-500 mb-4">{error}</div>
        <button onClick={() => router.push('/')} className="px-4 py-2 bg-primary text-white rounded-md">
          Retour à l&apos;accueil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-9rem)] flex items-center justify-center bg-background">
      <LoadingSpinner size="large" text="Redirection..." />
    </div>
  );
}
