export const MODEL_ROUTING_STORAGE_KEY = 'devpilot-model-routing-v1';
export const DEFAULT_MODEL_ROUTING = {
  mode: 'auto',
  primaryModel: '',
  fallbackModels: [],
};

export function isModelRoutingPreference(value) {
  return (
    value &&
    ['auto', 'manual', 'fallback'].includes(value.mode) &&
    typeof value.primaryModel === 'string' &&
    Array.isArray(value.fallbackModels) &&
    value.fallbackModels.every((model) => typeof model === 'string')
  );
}

export function normalizeModelRouting(preference, models, defaultModel) {
  const modelIds = new Set(models.map((model) => model.id));
  const primaryModel = modelIds.has(preference.primaryModel)
    ? preference.primaryModel
    : modelIds.has(defaultModel)
      ? defaultModel
      : models[0]?.id || defaultModel || '';
  const fallbackModels = preference.fallbackModels
    .filter(
      (model, index, all) =>
        modelIds.has(model) && model !== primaryModel && all.indexOf(model) === index,
    )
    .slice(0, 5);

  return { ...preference, primaryModel, fallbackModels };
}

export function buildRoutingRequest(preference) {
  if (preference.mode === 'auto') return { mode: 'auto' };
  if (preference.mode === 'fallback' && preference.fallbackModels.length) {
    return {
      mode: 'fallback',
      primaryModel: preference.primaryModel,
      fallbackModels: preference.fallbackModels,
    };
  }
  return { mode: 'manual', primaryModel: preference.primaryModel };
}
