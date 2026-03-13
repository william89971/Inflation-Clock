export interface ModuleSection {
  id: string;
  title: string;
  content: string;
  interactive?: string;
  eli5Available?: boolean;
}

export interface ModuleData {
  slug: string;
  title: string;
  hook: string;
  icon: string;
  path: number;
  pathName: string;
  readTime: number;
  sections: ModuleSection[];
}

export interface ModuleMeta {
  slug: string;
  icon: string;
  path: number;
  pathName: string;
  order: number;
  readTime: number;
  titleKey: string;
  hookKey: string;
}

export const LEARNING_PATHS: Record<number, string> = {
  1: "The Money Problem",
  2: "Bitcoin & Society",
  3: "Bitcoin & Industry",
  4: "How Bitcoin Works",
  5: "Take Action",
};

export const LEARNING_PATHS_ES: Record<number, string> = {
  1: "El Problema del Dinero",
  2: "Bitcoin y la Sociedad",
  3: "Bitcoin y la Industria",
  4: "Cómo Funciona Bitcoin",
  5: "Toma Acción",
};

export const MODULES: ModuleMeta[] = [
  // Path 1: The Money Problem
  { slug: "better-money", icon: "💰", path: 1, pathName: "The Money Problem", order: 1, readTime: 12, titleKey: "learn.better-money.title", hookKey: "learn.better-money.hook" },
  { slug: "your-salary", icon: "💸", path: 1, pathName: "The Money Problem", order: 2, readTime: 8, titleKey: "learn.your-salary.title", hookKey: "learn.your-salary.hook" },
  { slug: "food", icon: "🍞", path: 1, pathName: "The Money Problem", order: 3, readTime: 7, titleKey: "learn.food.title", hookKey: "learn.food.hook" },

  // Path 2: Bitcoin & Society
  { slug: "freedom", icon: "🗽", path: 2, pathName: "Bitcoin & Society", order: 4, readTime: 10, titleKey: "learn.freedom.title", hookKey: "learn.freedom.hook" },
  { slug: "human-rights", icon: "✊", path: 2, pathName: "Bitcoin & Society", order: 5, readTime: 10, titleKey: "learn.human-rights.title", hookKey: "learn.human-rights.hook" },
  { slug: "equality", icon: "⚖️", path: 2, pathName: "Bitcoin & Society", order: 6, readTime: 8, titleKey: "learn.equality.title", hookKey: "learn.equality.hook" },
  { slug: "property-rights", icon: "🏠", path: 2, pathName: "Bitcoin & Society", order: 7, readTime: 8, titleKey: "learn.property-rights.title", hookKey: "learn.property-rights.hook" },
  { slug: "housing", icon: "🏗️", path: 2, pathName: "Bitcoin & Society", order: 8, readTime: 7, titleKey: "learn.housing.title", hookKey: "learn.housing.hook" },
  { slug: "politics", icon: "🏛️", path: 2, pathName: "Bitcoin & Society", order: 9, readTime: 8, titleKey: "learn.politics.title", hookKey: "learn.politics.hook" },
  { slug: "war", icon: "⚔️", path: 2, pathName: "Bitcoin & Society", order: 10, readTime: 8, titleKey: "learn.war.title", hookKey: "learn.war.hook" },

  // Path 3: Bitcoin & Industry
  { slug: "business", icon: "📊", path: 3, pathName: "Bitcoin & Industry", order: 11, readTime: 9, titleKey: "learn.business.title", hookKey: "learn.business.hook" },
  { slug: "crowdfunding", icon: "🤝", path: 3, pathName: "Bitcoin & Industry", order: 12, readTime: 7, titleKey: "learn.crowdfunding.title", hookKey: "learn.crowdfunding.hook" },
  { slug: "energy", icon: "⚡", path: 3, pathName: "Bitcoin & Industry", order: 13, readTime: 10, titleKey: "learn.energy.title", hookKey: "learn.energy.hook" },
  { slug: "environment", icon: "🌱", path: 3, pathName: "Bitcoin & Industry", order: 14, readTime: 9, titleKey: "learn.environment.title", hookKey: "learn.environment.hook" },
  { slug: "art", icon: "🎨", path: 3, pathName: "Bitcoin & Industry", order: 15, readTime: 7, titleKey: "learn.art.title", hookKey: "learn.art.hook" },

  // Path 4: How Bitcoin Works
  { slug: "networks", icon: "🌐", path: 4, pathName: "How Bitcoin Works", order: 16, readTime: 8, titleKey: "learn.networks.title", hookKey: "learn.networks.hook" },
  { slug: "payments", icon: "⚡", path: 4, pathName: "How Bitcoin Works", order: 17, readTime: 9, titleKey: "learn.payments.title", hookKey: "learn.payments.hook" },
  { slug: "coding", icon: "💻", path: 4, pathName: "How Bitcoin Works", order: 18, readTime: 8, titleKey: "learn.coding.title", hookKey: "learn.coding.hook" },

  // Path 5: Take Action
  { slug: "self-custody", icon: "🔐", path: 5, pathName: "Take Action", order: 19, readTime: 10, titleKey: "learn.self-custody.title", hookKey: "learn.self-custody.hook" },
  { slug: "get-started", icon: "🚀", path: 5, pathName: "Take Action", order: 20, readTime: 8, titleKey: "learn.get-started.title", hookKey: "learn.get-started.hook" },
];

export function getModulesByPath(path: number): ModuleMeta[] {
  return MODULES.filter((m) => m.path === path).sort((a, b) => a.order - b.order);
}

export function getNextModule(currentSlug: string): ModuleMeta | null {
  const current = MODULES.find((m) => m.slug === currentSlug);
  if (!current) return null;
  return MODULES.find((m) => m.order === current.order + 1) ?? null;
}

export function getPrevModule(currentSlug: string): ModuleMeta | null {
  const current = MODULES.find((m) => m.slug === currentSlug);
  if (!current) return null;
  return MODULES.find((m) => m.order === current.order - 1) ?? null;
}

export async function getModuleContent(
  slug: string,
  locale: string
): Promise<ModuleData | null> {
  try {
    const mod = await import(`./${locale}/${slug}.json`);
    return mod.default as ModuleData;
  } catch {
    return null;
  }
}
