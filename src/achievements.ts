
export interface Achievements {
  baseI?: true;
  baseII?: true;
  baseIII?: true;
  baseIV?: true;
  baseV?: true;
  baseVI?: true;
  baseVII?: true;
  baseVIII?: true;
  baseIX?: true;
  baseX?: true;
};

export type AchievementName = keyof Achievements;

export type AchievementStack = AchievementName[] | AchievementName


export function checkAchievementRequirement(achievements: Achievements, requirement?: AchievementStack) {
  if (!requirement) return true

  if (Array.isArray(requirement)) {
    for (let i = 0; i < requirement.length; i++) {
      if (!achievements[requirement[i]]) return false
    }
  } else if (!achievements[requirement]) return false

  return true
}
export function addAchievement(achievements: Achievements, achievement?: AchievementStack) {
  if (!achievement) return

  if (Array.isArray(achievement)) {
    for (let i = 0; i < achievement.length; i++) {
      achievements[achievement[i]] = true
    }
  } else achievements[achievement] = true
}

