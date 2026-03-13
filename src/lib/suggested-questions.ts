import { UserProfile } from "./profile";

export function getPersonalizedQuestions(profile: UserProfile | null): string[] {
  const questions: string[] = [];

  questions.push("Why does everything keep getting more expensive?");

  if (!profile) {
    questions.push("What is inflation and why should I care?");
    questions.push("What is Bitcoin?");
    questions.push("Where should I start learning about Bitcoin?");
    return questions;
  }

  switch (profile.country_code) {
    case "SV":
      questions.push("How is Bitcoin actually used in El Salvador?");
      questions.push("Is the Bitcoin law working for regular Salvadorans?");
      break;
    case "AR":
      questions.push("Why does the peso keep crashing?");
      questions.push("How are Argentines using Bitcoin to protect their savings?");
      break;
    case "MX":
      questions.push("How much do remittance fees cost my family?");
      questions.push("Could Bitcoin help me send money to family cheaper?");
      break;
    case "US":
      questions.push("Why can't I afford rent like my parents could?");
      questions.push("Is Bitcoin actually a good savings strategy?");
      break;
    case "BR":
      questions.push("How has the Real lost value over the years?");
      break;
    case "CO":
      questions.push("Why are everyday prices going up so fast in Colombia?");
      break;
    case "VE":
      questions.push("How did Venezuela's hyperinflation happen?");
      break;
  }

  if (profile.monthly_income) {
    questions.push("What would saving 5% of my income in Bitcoin look like?");
  }
  if (profile.monthly_rent) {
    questions.push("Why has rent gone up so much?");
  }
  if (profile.monthly_groceries) {
    questions.push("Why are groceries getting more expensive?");
  }

  const modulesCount = profile.modules_completed?.length || 0;
  if (modulesCount === 0) {
    questions.push("Where should I start learning about Bitcoin?");
  } else if (modulesCount > 10) {
    questions.push("I understand Bitcoin — how do I actually start buying?");
    questions.push("What's the safest way to store my Bitcoin?");
  }

  if (profile.family_members?.length) {
    questions.push("How can I explain Bitcoin to my parents?");
  }

  return [...new Set(questions)].slice(0, 6);
}
