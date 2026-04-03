import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchMetadata(projectId: number): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/api/projects/${projectId}/metadata`);
  if (!res.ok) return {};
  return res.json();
}

async function saveSection(projectId: number, section: string, data: unknown): Promise<void> {
  await fetch(`${BASE}/api/projects/${projectId}/metadata`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ section, data }),
  });
}

export function useProjectMission<T>(projectId: number, section: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);
    fetchMetadata(projectId)
      .then((meta) => {
        if (meta[section] !== undefined) {
          setData(meta[section] as T);
        }
      })
      .finally(() => setIsLoading(false));
  }, [projectId, section]);

  const save = useCallback(
    async (newData?: T) => {
      const toSave = newData !== undefined ? newData : data;
      setIsSaving(true);
      try {
        await saveSection(projectId, section, toSave);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } finally {
        setIsSaving(false);
      }
    },
    [projectId, section, data]
  );

  return { data, setData, save, isSaving, isLoading, saved };
}
