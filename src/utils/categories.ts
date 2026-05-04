import { EXPENSE_CATEGORIES } from '../constants/categories';
import type { AppLocale } from '../i18n/translations';
import { BUILTIN_CATEGORY_LABELS } from '../i18n/translations';
import { MonefyCore, parseJson } from '../native/monefyCore';
import type { CustomCategory, UiCategory } from '../types';

export async function loadCustomCategories(): Promise<CustomCategory[]> {
  try {
    const j = await MonefyCore.getCustomCategoriesJson();
    return parseJson<CustomCategory[]>(j);
  } catch {
    return [];
  }
}

export function mergeUiCategories(
  custom: CustomCategory[],
  locale: AppLocale,
): UiCategory[] {
  const builtinIds = new Set(EXPENSE_CATEGORIES.map(c => c.id));
  const built: UiCategory[] = EXPENSE_CATEGORIES.map(c => ({
    id: c.id,
    label: BUILTIN_CATEGORY_LABELS[locale][c.id] ?? c.id,
    iconName: c.iconName,
    color: c.color,
    isCustom: false,
  }));
  const onlyCustom = custom
    .filter(uc => !builtinIds.has(uc.id))
    .map(uc => ({
      id: uc.id,
      label: uc.label,
      iconName: uc.iconName,
      color: uc.iconColor,
      isCustom: true,
    }));
  return [...built, ...onlyCustom];
}
