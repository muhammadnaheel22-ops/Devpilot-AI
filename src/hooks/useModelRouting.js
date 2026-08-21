import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getOpenRouterModels } from '../services/openRouterService';
import { readStoredJson, writeStoredJson } from '../utils/storage';
import {
  buildRoutingRequest,
  DEFAULT_MODEL_ROUTING,
  isModelRoutingPreference,
  MODEL_ROUTING_STORAGE_KEY,
  normalizeModelRouting,
} from '../utils/modelRouting';

export function useModelRouting() {
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [routing, setRouting] = useState(() =>
    readStoredJson(MODEL_ROUTING_STORAGE_KEY, DEFAULT_MODEL_ROUTING, isModelRoutingPreference),
  );

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    getOpenRouterModels({ signal: controller.signal })
      .then(({ models: availableModels, defaultModel }) => {
        if (!active) return;
        setModels(availableModels);
        setRouting((current) => normalizeModelRouting(current, availableModels, defaultModel));
      })
      .catch((error) => {
        if (active && error.name !== 'AbortError')
          toast.error('Could not refresh the model catalog.');
      })
      .finally(() => {
        if (active) setModelsLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    writeStoredJson(MODEL_ROUTING_STORAGE_KEY, routing);
  }, [routing]);

  const requestRouting = useMemo(() => buildRoutingRequest(routing), [routing]);
  return { models, modelsLoading, routing, setRouting, requestRouting };
}
