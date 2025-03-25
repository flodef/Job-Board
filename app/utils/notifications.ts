import { ConciergerieNotificationSettings, EmployeeNotificationSettings } from '@/app/types/types';

export const defaultConciergerieSettings: ConciergerieNotificationSettings = {
  acceptedMissions: true,
  startedMissions: true,
  completedMissions: true,
  missionsEndedWithoutStart: true,
};
export const defaultEmployeeSettings: EmployeeNotificationSettings = {
  acceptedMissions: true,
  missionChanged: true,
  missionDeleted: true,
  missionsCanceled: true,
};
