// src/utils/i18nHelper.js
export function localizedField(obj, field, lang, fallback = '') {
  return obj?.translations?.[field]?.[lang] || obj?.[field] || fallback
}
