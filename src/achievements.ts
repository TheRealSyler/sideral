export interface Achievements {
  'Base I'?: true;
  'Base II'?: true;
  'Base III'?: true;
  'Base IV'?: true;
  'Base V'?: true;
  'Base VI'?: true;
  'Base VII'?: true;
  'Base VIII'?: true;
  'Base IX'?: true;
  'Base X'?: true;
  'Woodcutter I'?: true;
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

