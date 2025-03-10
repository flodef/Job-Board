'use client';

import { IconBriefcase, IconPlus } from '@tabler/icons-react';
import clsx from 'clsx/lite';
import { useEffect, useState } from 'react';
import ConfirmationModal from '../components/confirmationModal';
import FloatingActionButton from '../components/floatingActionButton';
import FullScreenModal from '../components/fullScreenModal';
import HomeForm from '../components/homeForm';
import LoadingSpinner from '../components/loadingSpinner';
import MissionCard from '../components/missionCard';
import MissionDetails from '../components/missionDetails';
import MissionForm from '../components/missionForm';
import { useHomes } from '../contexts/homesProvider';
import { useMissions } from '../contexts/missionsProvider';
import { useTheme } from '../contexts/themeProvider';
import { useRedirectIfNotRegistered } from '../utils/redirectIfNotRegistered';
import { getWelcomeParams } from '../utils/welcomeParams';

export default function Missions() {
  const { missions, isLoading, getCurrentConciergerie } = useMissions();
  const { homes } = useHomes();
  const { setPrimaryColor, resetPrimaryColor } = useTheme();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddHomeModalOpen, setIsAddHomeModalOpen] = useState(false);
  const [isNoHomesModalOpen, setIsNoHomesModalOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);

  // Redirect if not registered
  useRedirectIfNotRegistered();

  // Apply theme color on component mount and get user type
  useEffect(() => {
    const { conciergerieData, userType } = getWelcomeParams();
    if (userType === 'conciergerie') {
      if (conciergerieData && conciergerieData.color) {
        setPrimaryColor(conciergerieData.color);
      } else {
        resetPrimaryColor();
      }
    }

    setUserType(userType);
  }, [setPrimaryColor, resetPrimaryColor]);

  // Get current conciergerie
  const currentConciergerie = getCurrentConciergerie();

  // Filter missions:
  // 1. Not deleted
  // 2. Taken by the current employee
  // Then sort by date (closest to today first)
  const activeMissions = missions
    .filter(mission => {
      // Filter out deleted missions and past missions
      if (mission.deleted || new Date(mission.endDateTime) < new Date()) return false;

      // For employee users, show only Available missions (not taken by anyone)
      if (userType === 'employee') return !mission.employeeId;

      // For conciergerie users, show all the missions
      return true;
    })
    .sort((a, b) => {
      // Sort by date (closest to today first)
      return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
    });

  // Filter homes by the current conciergerie
  const filteredHomes = homes.filter(home => !home.deleted && home.conciergerieName === currentConciergerie?.name);

  const handleMissionClick = (missionId: string) => {
    setSelectedMission(missionId);
  };

  const handleMissionEdit = (missionId: string) => {
    setSelectedMission(missionId);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setSelectedMission(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedMission(null);
  };

  const handleCloseHomeModal = () => {
    setIsAddHomeModalOpen(false);
  };

  const handleAddMission = () => {
    // Check if there are any homes available
    if (filteredHomes.length === 0) {
      // Show confirmation modal if no homes are available
      setIsNoHomesModalOpen(true);
    } else {
      // Open mission form if homes are available
      setIsAddModalOpen(true);
    }
  };

  const handleAddHomeConfirm = () => {
    setIsNoHomesModalOpen(false);
    setIsAddHomeModalOpen(true);
  };

  const handleAddHomeCancel = () => {
    setIsNoHomesModalOpen(false);
  };

  const selectedMissionData = selectedMission ? missions.find(mission => mission.id === selectedMission) : null;

  // Show loading spinner while loading missions
  if (isLoading) {
    return (
      <div className="min-h-[calc(100dvh-9rem)] flex items-center justify-center bg-background">
        <LoadingSpinner size="large" text="Chargement des missions..." />
      </div>
    );
  }

  return (
    <div>
      {activeMissions.length === 0 ? (
        <div
          className={clsx(
            'flex flex-col items-center justify-center h-[calc(100dvh-10rem)] border-2 border-dashed border-secondary rounded-lg p-8',
            userType === 'conciergerie' ? 'cursor-pointer' : '',
          )}
          onClick={userType === 'conciergerie' ? handleAddMission : undefined}
        >
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">Aucune mission</h3>
            {userType === 'conciergerie' ? (
              <>
                <p className="text-light mb-4">Ajoutez votre première mission</p>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                  <IconPlus size={32} />
                </div>
              </>
            ) : (
              <>
                <p className="text-light mb-4">Aucune mission n&apos;est disponible pour le moment</p>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                  <IconBriefcase size={32} />
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeMissions.map(mission => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onClick={() => handleMissionClick(mission.id)}
              onEdit={userType === 'conciergerie' ? () => handleMissionEdit(mission.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Only show the floating action button for conciergerie users */}
      {activeMissions.length > 0 && userType === 'conciergerie' && <FloatingActionButton onClick={handleAddMission} />}

      {isAddModalOpen && (
        <FullScreenModal onClose={handleCloseModal} title="Nouvelle mission">
          <MissionForm onClose={handleCloseModal} mode="add" />
        </FullScreenModal>
      )}

      {selectedMissionData && !isEditModalOpen && (
        <MissionDetails mission={selectedMissionData} onClose={() => setSelectedMission(null)} />
      )}

      {selectedMissionData && isEditModalOpen && (
        <FullScreenModal onClose={handleCloseEditModal} title="Modification de la mission">
          <MissionForm mission={selectedMissionData} onClose={handleCloseEditModal} mode="edit" />
        </FullScreenModal>
      )}

      {isAddHomeModalOpen && (
        <FullScreenModal onClose={handleCloseHomeModal} title="Nouveau bien">
          <HomeForm
            onClose={() => {
              handleCloseHomeModal();
              // If at least one home was added, open the mission form
              if (filteredHomes.length > 0) {
                setIsAddModalOpen(true);
              }
            }}
            mode="add"
          />
        </FullScreenModal>
      )}

      <ConfirmationModal
        isOpen={isNoHomesModalOpen}
        onConfirm={handleAddHomeConfirm}
        onCancel={handleAddHomeCancel}
        title="Aucun bien disponible"
        message="Vous devez d'abord ajouter un bien avant de créer une mission. Voulez-vous ajouter un bien maintenant ?"
        confirmText="Ajouter un bien"
        cancelText="Annuler"
      />
    </div>
  );
}
