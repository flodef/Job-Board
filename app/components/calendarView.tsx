'use client';

import { IconCalendarEvent, IconClock, IconPlayerPlay, IconAlertTriangle } from '@tabler/icons-react';
import clsx from 'clsx/lite';
import { useEffect, useState } from 'react';
import { useMissions } from '../contexts/missionsProvider';
import { Mission } from '../types/types';
import {
  formatCalendarDate,
  formatMissionTimeForCalendar,
  groupMissionsByDate,
  isPastDate,
  isToday,
  sortDates,
} from '../utils/calendarUtils';
import { formatDateRange } from '../utils/dateUtils';
import { formatPoints } from '../utils/formatUtils';
import { calculateEmployeePointsForDay, calculateMissionPoints, getObjectiveWithPoints } from '../utils/objectiveUtils';
import { getColorValueByName, getWelcomeParams } from '../utils/welcomeParams';
import LoadingSpinner from './loadingSpinner';
import MissionDetails from '../missions/components/missionDetails';

export default function CalendarView() {
  const { missions, isLoading, getConciergerieByName } = useMissions();
  const { employeeData, conciergerieData, userType } = getWelcomeParams();

  const [acceptedMissions, setAcceptedMissions] = useState<Mission[]>([]);
  const [missionsByDate, setMissionsByDate] = useState<Map<string, Mission[]>>(new Map());
  const [sortedDates, setSortedDates] = useState<string[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | undefined>(undefined);
  const [currentConciergerieName, setCurrentConciergerieName] = useState<string | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);
  const [startedMissionsCount, setStartedMissionsCount] = useState(0);
  const [lateMissionsCount, setLateMissionsCount] = useState(0);

  const isEmployee = userType === 'employee';
  const isConciergerie = userType === 'conciergerie';

  // First useEffect to handle client-side initialization
  useEffect(() => {
    setIsClient(true);
    if (isEmployee) {
      setCurrentEmployeeId(employeeData?.id);
    } else if (isConciergerie) {
      setCurrentConciergerieName(conciergerieData?.name);
    }
  }, [employeeData, conciergerieData, isEmployee, isConciergerie]);

  // Second useEffect to handle mission filtering after we have the user identity
  useEffect(() => {
    if (!isEmployee && !isConciergerie) return;

    let filteredMissions: Mission[] = [];

    if (isEmployee && currentEmployeeId) {
      // For employees: show missions accepted by this employee
      filteredMissions = missions.filter(
        mission => mission.employeeId === currentEmployeeId && !mission.deleted && mission.status !== 'completed',
      );
    } else if (isConciergerie && currentConciergerieName) {
      // For conciergeries: show missions from this conciergerie that have been accepted by employees
      filteredMissions = missions.filter(
        mission => mission.conciergerieName === currentConciergerieName && mission.employeeId && !mission.deleted,
      );
    }

    // Count started missions
    const startedCount = filteredMissions.filter(mission => mission.status === 'started').length;
    setStartedMissionsCount(startedCount);

    // Count late missions (ended without being started)
    const lateCount = filteredMissions.filter(
      mission =>
        mission.employeeId &&
        (!mission.status || mission.status === 'pending') &&
        new Date(mission.endDateTime) < new Date(),
    ).length;
    setLateMissionsCount(lateCount);

    setAcceptedMissions(filteredMissions);

    // Group missions by date
    const groupedMissions = groupMissionsByDate(filteredMissions);
    setMissionsByDate(groupedMissions);

    // Sort dates
    const dates = Array.from(groupedMissions.keys());
    setSortedDates(sortDates(dates));
  }, [missions, currentEmployeeId, currentConciergerieName, isEmployee, isConciergerie]);

  const handleMissionClick = (mission: Mission) => {
    setSelectedMission(mission);
  };

  const handleCloseDetails = () => {
    setSelectedMission(null);
  };

  // Check if a mission is ended without being started
  const isEndedWithoutStarting = (mission: Mission) => {
    // Mission is accepted (has employeeId)
    // Mission is not started (status is not 'started' or 'completed')
    // Mission end date is in the past
    return (
      mission.employeeId &&
      (!mission.status || mission.status === 'pending') &&
      new Date(mission.endDateTime) < new Date()
    );
  };

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return null;
  }

  if (isEmployee && !currentEmployeeId) return null;
  if (isConciergerie && !currentConciergerieName) return null;

  if (isLoading) {
    return (
      <div className="min-h-[calc(100dvh-9rem)] flex items-center justify-center bg-background">
        <LoadingSpinner size="large" text="Chargement du calendrier..." />
      </div>
    );
  }

  if (acceptedMissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-10rem)] border-2 border-dashed border-secondary rounded-lg p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">
            {isEmployee ? 'Aucune mission acceptée' : 'Aucune mission en cours'}
          </h3>
          <p className="text-light mb-4">
            {isEmployee
              ? "Vous n'avez pas encore accepté de missions"
              : "Aucun employé n'a accepté de missions de votre conciergerie"}
          </p>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <IconCalendarEvent size={32} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Badge for started missions */}
      <div className="sticky top-0 z-20 bg-background space-y-2 mb-4">
        {startedMissionsCount > 0 && (
          <div className="p-2 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <IconPlayerPlay className="text-blue-500 mr-2" />
              <span>
                <span className="font-medium">{startedMissionsCount}</span> mission{startedMissionsCount > 1 ? 's' : ''}{' '}
                en cours
              </span>
            </div>
          </div>
        )}

        {lateMissionsCount > 0 && (
          <div className="p-2 border border-red-200 bg-red-50 dark:bg-red-950/10 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <IconAlertTriangle className="text-red-500 mr-2" />
              <span>
                <span className="font-medium">{lateMissionsCount}</span> mission{lateMissionsCount > 1 ? 's' : ''} en
                retard non terminée{lateMissionsCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
      {selectedMission && (
        <MissionDetails mission={selectedMission} onClose={handleCloseDetails} isFromCalendar={true} />
      )}

      <div className="space-y-6">
        {sortedDates.map(dateStr => {
          // Create a date object from the date string (which is in YYYY-MM-DD format)
          // Parse the parts manually to ensure we're using local time
          const [year, month, day] = dateStr.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          const formattedDate = formatCalendarDate(date);
          const missionsForDate = missionsByDate.get(dateStr) || [];

          return (
            <div key={dateStr} className="border border-secondary rounded-lg overflow-hidden">
              <div
                className={clsx(
                  'p-3 font-medium border-b border-secondary',
                  isToday(date) ? 'bg-primary/10' : isPastDate(date) ? 'bg-secondary/30' : 'bg-secondary/10',
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className={clsx(isToday(date) && 'text-primary font-bold')}>
                    {formattedDate}
                    {isToday(date) && " (Aujourd'hui)"}
                  </h3>
                  <div className="flex gap-2">
                    <span className="text-sm bg-primary/10 px-2 py-1 rounded-full text-nowrap">
                      {missionsForDate.length} mission{missionsForDate.length > 1 ? 's' : ''}
                    </span>
                    {isEmployee && currentEmployeeId && (
                      <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full text-nowrap">
                        {formatPoints(calculateEmployeePointsForDay(currentEmployeeId, date, missions))} pts
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-secondary/30">
                {missionsForDate.map(mission => {
                  const conciergerie = getConciergerieByName(mission.conciergerieName);
                  const conciergerieColor = getColorValueByName(conciergerie?.colorName);
                  const { totalPoints } = calculateMissionPoints(mission);

                  return (
                    <div
                      key={mission.id}
                      className={clsx(
                        'p-3 hover:bg-secondary/10 cursor-pointer transition-colors relative',
                        mission.status === 'started' ? 'animate-pulse' : '',
                      )}
                      onClick={() => handleMissionClick(mission)}
                    >
                      {isEndedWithoutStarting(mission) && (
                        <div
                          className="absolute text-sm font-bold text-white bg-red-500/80 px-1 py-0.5 uppercase tracking-wider whitespace-nowrap z-10"
                          style={{
                            transform: 'rotate(15deg) scale(0.9)',
                            transformOrigin: 'center',
                            width: '140%',
                            textAlign: 'center',
                            top: '50%',
                            left: '50%',
                            marginLeft: '-70%',
                            marginTop: '-10px',
                          }}
                        >
                          ⚠️ MISSION EN RETARD NON TERMINÉE ⚠️
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: conciergerieColor }}
                          ></div>
                          <span className="font-medium">{mission.conciergerieName}</span>
                        </div>
                        <div className="text-sm flex items-center gap-1">
                          <IconClock size={16} />
                          <span>{formatMissionTimeForCalendar(mission, date)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2 mb-2">
                        {mission.objectives.map(objective => (
                          <span
                            key={mission.id + objective.label}
                            className="px-2 py-0.5 text-background rounded-full text-xs flex items-center gap-1"
                            style={{ backgroundColor: conciergerieColor }}
                          >
                            <span>{objective.label}</span>
                            <span className="ml-1 px-1 py-0.5 bg-background/20 rounded-full text-xs">
                              {getObjectiveWithPoints(objective.label)?.points || 0} pt
                            </span>
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-col justify-between text-sm">
                        <div className="flex items-center">
                          <span className="text-light text-nowrap">Points :&nbsp;</span>
                          <span className="font-medium">{formatPoints(totalPoints)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-light text-nowrap">Durée :&nbsp;</span>
                          <span className="font-medium">
                            {formatDateRange(new Date(mission.startDateTime), new Date(mission.endDateTime))}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
