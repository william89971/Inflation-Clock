import { UserProfile } from "./profile";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TOTAL_MODULES = 20;

export interface ReturnVisitData {
  lossSinceLastVisit: number;
  daysSinceLastVisit: number;
  modulesCompleted: number;
  totalModules: number;
}

export function calculateReturnVisitData(
  profile: UserProfile
): ReturnVisitData {
  const now = new Date();
  const lastVisit = profile.last_visit ? new Date(profile.last_visit) : now;
  const daysSinceLastVisit = Math.max(
    0,
    Math.floor((now.getTime() - lastVisit.getTime()) / MS_PER_DAY)
  );
  const lossSinceLastVisit = (profile.daily_loss || 0) * daysSinceLastVisit;
  const modulesCompleted = profile.modules_completed?.length || 0;

  return {
    lossSinceLastVisit,
    daysSinceLastVisit,
    modulesCompleted,
    totalModules: TOTAL_MODULES,
  };
}
