import ConfirmationModal from '@/app/components/confirmationModal';
import React, { useState } from 'react';

interface AdvancedSettingsProps {
  userType?: 'conciergerie' | 'employee';
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ userType }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showNukeConfirmation, setShowNukeConfirmation] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex flex-col space-y-4 text-center">
        <div>
          <button
            onClick={() => setShowConfirmation(true)}
            className="px-4 py-2 bg-red-500/90 hover:bg-red-500 text-white rounded-md transition-colors"
          >
            Réinitialiser mes données
          </button>
          <p className="text-sm text-foreground/70 mt-2">
            Cette action supprimera votre accès à l&apos;application et vous redirigera vers la page d&apos;accueil.
          </p>
        </div>

        {/* Nuke button - only for conciergerie */}
        {userType === 'conciergerie' && (
          <div className="mt-4">
            <button
              onClick={() => setShowNukeConfirmation(true)}
              className="px-4 py-2 bg-red-700/90 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              Supprimer toutes les données
            </button>
            <p className="text-sm text-foreground/70 mt-2">
              Cette action supprimera toutes les données de l&apos;application, y compris les missions, les prestataires
              et les logements.
            </p>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={() => {
          // Clear only the user type from localStorage (keep other data)
          localStorage.removeItem('user_type');

          // Force a full page reload to reset the app state
          window.location.href = '/';
        }}
        title="Réinitialiser mes données"
        confirmText="Réinitialiser"
        cancelText="Annuler"
        isDangerous={true}
      >
        <p>Êtes-vous sûr de vouloir réinitialiser vos données personnelles ? Cette action est importante car :</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Vous serez déconnecté de votre profil actuel</li>
          <li>Vous devrez remplir à nouveau votre profil utilisateur et faire une demande d&apos;accès</li>
          <li>Vos données personnelles resteront enregistrées mais ne seront plus associées à votre profil</li>
        </ul>
      </ConfirmationModal>

      {/* Nuke confirmation modal */}
      <ConfirmationModal
        isOpen={showNukeConfirmation}
        onClose={() => setShowNukeConfirmation(false)}
        onConfirm={() => {
          // Clear all data from localStorage
          localStorage.clear();

          // Force a full page reload to reset the app state
          window.location.href = '/';
        }}
        title="Supprimer toutes les données"
        confirmText="Supprimer tout"
        cancelText="Annuler"
        isDangerous={true}
      >
        <p>
          Êtes-vous sûr de vouloir supprimer toutes les données de l&apos;application ? Cette action est irréversible et
          :
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Supprimera toutes les missions, prestataires et logements</li>
          <li>Déconnectera tous les utilisateurs</li>
          <li>Réinitialisera complètement l&apos;application</li>
          <li>Vous devrez reconfigurer entièrement votre conciergerie</li>
        </ul>
      </ConfirmationModal>
    </div>
  );
};

export default AdvancedSettings;
