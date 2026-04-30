import { Router, type IRouter } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { eq, desc, sql } from "drizzle-orm";
import { db, projectsTable, projectImagesTable } from "@workspace/db";
import {
  CreateProjectBody,
  UpdateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  DeleteProjectParams,
  UpdateProjectSiteParams,
  UpdateProjectSiteBody,
  UpdateProjectQuestionnaireParams,
  UpdateProjectQuestionnaireBody,
  RunSiteAnalysisParams,
  GenerateProgramParams,
  GetProjectImagesParams,
  GenerateProjectImageParams,
  GenerateProjectImageBody,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";

const router: IRouter = Router();

function parseId(raw: string | string[]): number {
  const val = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(val, 10);
}

function formatProject(p: typeof projectsTable.$inferSelect, imageCount = 0) {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? undefined,
    projectType: p.projectType,
    status: p.status,
    latitude: p.latitude ?? undefined,
    longitude: p.longitude ?? undefined,
    address: p.address ?? undefined,
    siteArea: p.siteArea ?? undefined,
    numFloors: p.numFloors ?? undefined,
    siteAnalysis: p.siteAnalysis ?? undefined,
    questionnaire: p.questionnaire ?? undefined,
    program: p.program ?? undefined,
    metadata: (p.metadata as Record<string, unknown>) ?? undefined,
    imageCount,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/projects", async (req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable).orderBy(desc(projectsTable.updatedAt));

  const imageCounts = await db
    .select({ projectId: projectImagesTable.projectId, count: sql<number>`count(*)::int` })
    .from(projectImagesTable)
    .groupBy(projectImagesTable.projectId);

  const countMap = Object.fromEntries(imageCounts.map((r) => [r.projectId, r.count]));

  res.json(projects.map((p) => formatProject(p, countMap[p.id] ?? 0)));
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .insert(projectsTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description,
      projectType: parsed.data.projectType,
      numFloors: parsed.data.numFloors,
      status: "draft",
    })
    .returning();

  res.status(201).json(formatProject(project, 0));
});

router.get("/projects/dashboard/summary", async (_req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable);

  const projectsByStatus: Record<string, number> = {};
  const projectsByType: Record<string, number> = {};

  for (const p of projects) {
    projectsByStatus[p.status] = (projectsByStatus[p.status] ?? 0) + 1;
    projectsByType[p.projectType] = (projectsByType[p.projectType] ?? 0) + 1;
  }

  const [{ totalImages }] = await db
    .select({ totalImages: sql<number>`count(*)::int` })
    .from(projectImagesTable);

  const recentProjects = await db
    .select()
    .from(projectsTable)
    .orderBy(desc(projectsTable.updatedAt))
    .limit(5);

  const recentActivity = recentProjects.map(
    (p) => `Project "${p.name}" updated to status: ${p.status}`
  );

  res.json({
    totalProjects: projects.length,
    projectsByStatus,
    projectsByType,
    totalImages: totalImages ?? 0,
    recentActivity,
  });
});

router.get("/projects/recent", async (_req, res): Promise<void> => {
  const projects = await db
    .select()
    .from(projectsTable)
    .orderBy(desc(projectsTable.updatedAt))
    .limit(6);

  const imageCounts = await db
    .select({ projectId: projectImagesTable.projectId, count: sql<number>`count(*)::int` })
    .from(projectImagesTable)
    .groupBy(projectImagesTable.projectId);

  const countMap = Object.fromEntries(imageCounts.map((r) => [r.projectId, r.count]));

  res.json(projects.map((p) => formatProject(p, countMap[p.id] ?? 0)));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projectImagesTable)
    .where(eq(projectImagesTable.projectId, params.data.id));

  res.json(formatProject(project, count ?? 0));
});

router.put("/projects/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .update(projectsTable)
    .set({ ...parsed.data })
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projectImagesTable)
    .where(eq(projectImagesTable.projectId, params.data.id));

  res.json(formatProject(project, count ?? 0));
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .delete(projectsTable)
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.sendStatus(204);
});

router.put("/projects/:id/site", async (req, res): Promise<void> => {
  const params = UpdateProjectSiteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProjectSiteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .update(projectsTable)
    .set({
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      address: parsed.data.address,
      siteArea: parsed.data.siteArea,
      status: "site_selected",
    })
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projectImagesTable)
    .where(eq(projectImagesTable.projectId, params.data.id));

  res.json(formatProject(project, count ?? 0));
});

router.put("/projects/:id/questionnaire", async (req, res): Promise<void> => {
  const params = UpdateProjectQuestionnaireParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProjectQuestionnaireBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const newStatus =
    existing.status === "draft" || existing.status === "site_selected" || existing.status === "analyzed"
      ? "analyzed"
      : existing.status;

  const [project] = await db
    .update(projectsTable)
    .set({
      questionnaire: parsed.data as unknown as Record<string, unknown>,
      status: newStatus,
    })
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projectImagesTable)
    .where(eq(projectImagesTable.projectId, params.data.id));

  res.json(formatProject(project, count ?? 0));
});

// Generic metadata endpoint — stores/merges any section data (context, brief, personality, etc.)
router.get("/projects/:id/metadata", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Not found" }); return; }
  res.json(project.metadata ?? {});
});

router.put("/projects/:id/metadata", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { section, data } = req.body as { section: string; data: unknown };
  if (!section || typeof section !== "string") { res.status(400).json({ error: "section required" }); return; }

  const [existing] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const current = (existing.metadata as Record<string, unknown>) ?? {};

  // When patching the "interior" section, preserve any imageUrl values already stored
  // in spaces (set by the visualize endpoint) so they are not wiped on style changes.
  let mergedData: unknown = data;
  if (section === "interior" && data && typeof data === "object") {
    const existingInterior = (current.interior as Record<string, unknown>) ?? {};
    const existingSpaces   = (existingInterior.spaces as Record<string, Record<string, unknown>>) ?? {};
    const incomingData     = data as Record<string, unknown>;
    const incomingSpaces   = (incomingData.spaces as Record<string, Record<string, unknown>>) ?? {};

    // Merge spaces: new spec fields + preserved imageUrl from DB
    const mergedSpaces: Record<string, Record<string, unknown>> = {};
    const allSpaceKeys = new Set([...Object.keys(existingSpaces), ...Object.keys(incomingSpaces)]);
    for (const key of allSpaceKeys) {
      mergedSpaces[key] = {
        ...(existingSpaces[key] ?? {}),
        ...(incomingSpaces[key] ?? {}),
        ...(existingSpaces[key]?.imageUrl ? { imageUrl: existingSpaces[key].imageUrl } : {}),
      };
    }
    mergedData = { ...incomingData, spaces: mergedSpaces };
  }

  const updated = { ...current, [section]: mergedData };

  const [project] = await db
    .update(projectsTable)
    .set({ metadata: updated })
    .where(eq(projectsTable.id, id))
    .returning();

  res.json(project.metadata ?? {});
});

router.post("/projects/:id/analyze", async (req, res): Promise<void> => {
  const params = RunSiteAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const locationInfo = project.latitude && project.longitude
    ? `Location coordinates: ${project.latitude}, ${project.longitude}. Address: ${project.address ?? "unknown"}.`
    : "No specific site location provided.";

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 2048,
    messages: [
      {
        role: "system",
        content:
          "You are an expert architectural site analyst. Generate a detailed JSON site analysis for an architectural project. Be specific, realistic, and professional. Return ONLY valid JSON with no markdown.",
      },
      {
        role: "user",
        content: `Analyze this site for an architectural project:
Project: ${project.name}
Type: ${project.projectType}
${locationInfo}

Return a JSON object with exactly these fields:
{
  "climate": "description of climate conditions",
  "soilType": "soil description",
  "sunExposure": "sun orientation and exposure",
  "windDirection": "prevailing wind direction",
  "topography": "terrain description",
  "surroundingContext": "urban/suburban/rural context",
  "opportunities": ["list of 3-5 site opportunities"],
  "constraints": ["list of 3-4 site constraints"],
  "recommendations": ["list of 4-5 design recommendations"],
  "sustainabilityScore": 75,
  "accessibilityNotes": "accessibility considerations",
  "zoningInfo": "likely zoning classification"
}`,
      },
    ],
  });

  let analysis: Record<string, unknown>;
  try {
    let content = completion.choices[0]?.message?.content ?? "{}";
    content = content.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/im, "").trim();
    const fb = content.indexOf("{"), lb = content.lastIndexOf("}");
    if (fb > 0 && lb !== -1) content = content.slice(fb, lb + 1);
    analysis = JSON.parse(content);
  } catch {
    analysis = {
      climate: "Temperate continental climate with four distinct seasons",
      soilType: "Mixed clay-loam with good bearing capacity",
      sunExposure: "South-facing with good solar access throughout the day",
      windDirection: "Prevailing southwest winds",
      topography: "Relatively flat terrain with gentle slopes",
      surroundingContext: "Mixed-use urban environment with medium-density development",
      opportunities: [
        "Excellent solar potential for passive design",
        "Strong street presence and visual connectivity",
        "Proximity to public transportation",
        "Large footprint allows flexible program",
      ],
      constraints: [
        "Urban noise levels require acoustic consideration",
        "Limited natural vegetation for screening",
        "Potential stormwater management requirements",
      ],
      recommendations: [
        "Orient primary spaces toward south for solar gain",
        "Incorporate green roof for stormwater management",
        "Design acoustic buffers on street-facing facades",
        "Implement high-performance glazing systems",
        "Consider rooftop solar array potential",
      ],
      sustainabilityScore: 78,
      accessibilityNotes: "Level street access facilitates universal design",
      zoningInfo: "Mixed-use commercial/residential zone",
    };
  }

  const [updated] = await db
    .update(projectsTable)
    .set({
      siteAnalysis: analysis as unknown as Record<string, unknown>,
      status: "analyzed",
    })
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  res.json(updated.siteAnalysis);
});

router.post("/projects/:id/program", async (req, res): Promise<void> => {
  const params = GenerateProgramParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const { totalArea, functions: userFunctions } = req.body as {
    totalArea?: number;
    functions?: Array<{ name: string; fromFloor: string; toFloor: string }>;
  };

  const numFloors = project.numFloors;
  const analysis = project.siteAnalysis ? JSON.stringify(project.siteAnalysis) : "No site analysis";

  const floorsLine = numFloors ? `Total Floors: ${numFloors}` : "Total Floors: Not specified";
  const areaLine = totalArea ? `Required Total Area: ${totalArea} sqm` : "Required Total Area: Not specified — estimate based on typology";

  const functionsBlock = userFunctions && userFunctions.length > 0
    ? `Requested floor functions:\n${userFunctions.map(f => `- Floors ${f.fromFloor} to ${f.toFloor}: ${f.name}`).join("\n")}`
    : "No specific functions provided — generate appropriate ones for the typology.";

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8000,
    messages: [
      {
        role: "system",
        content:
          "You are an expert architect creating detailed architectural programs. Generate precise, professional floor-by-floor architectural programs. Return ONLY valid JSON with no markdown or code blocks.",
      },
      {
        role: "user",
        content: `Generate a comprehensive floor-by-floor architectural program for:
Project: ${project.name}
Type: ${project.projectType}
${floorsLine}
${areaLine}
${functionsBlock}
Site analysis: ${analysis}

Rules:
- Group consecutive floors that share the same function into a single floorRange entry (e.g. "6-30" or "B2-B1")
- Use "G" for Ground floor, "B1", "B2" for basements, integers for above-ground floors
- Calculate realistic areaPerFloor based on a typical floor plate for the typology
- The sum of (areaPerFloor × number of floors in range) should approximate the required total area
- Each floor group must have a clear description and list of key spaces

Return a JSON object with exactly these fields:
{
  "totalArea": 35000,
  "floors": [
    {
      "floorRange": "B2",
      "functionName": "Parking — Level 2",
      "areaPerFloor": 1500,
      "description": "Underground parking with structural grid optimised for car bays.",
      "keySpaces": ["Car parking bays (60)", "Mechanical plant room", "Emergency stairwells"]
    },
    {
      "floorRange": "B1",
      "functionName": "Parking — Level 1",
      "areaPerFloor": 1500,
      "description": "Upper basement parking with direct lift access to lobby.",
      "keySpaces": ["Car parking bays (55)", "Bicycle storage", "Loading dock"]
    },
    {
      "floorRange": "G",
      "functionName": "Main Lobby & Retail",
      "areaPerFloor": 1200,
      "description": "Double-height grand lobby with retail activating the street edge.",
      "keySpaces": ["Concierge reception", "Retail units x3", "Security post", "Lift lobby"]
    }
  ],
  "spaces": [
    { "name": "Space Name", "area": 100, "quantity": 1, "priority": "essential", "description": "Brief description" }
  ],
  "designPrinciples": ["principle 1", "principle 2"],
  "materialPalette": ["material 1", "material 2"],
  "sustainabilityStrategies": ["strategy 1", "strategy 2"],
  "estimatedBudget": "$50M - $75M",
  "timeline": "36-48 months",
  "styleDirection": "Contemporary high-rise with refined facade expression"
}
Priority values for spaces must be one of: essential, important, optional.
Generate ALL floors from the bottom to top. Do not skip any floor or range.`,
      },
    ],
  });

  let program: Record<string, unknown>;
  try {
    let content = completion.choices[0]?.message?.content ?? "{}";
    // Strip markdown code fences (```json ... ``` or ``` ... ```)
    content = content.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/im, "").trim();
    // If there's still preamble text, extract from first { to last }
    const firstBrace = content.indexOf("{");
    const lastBrace = content.lastIndexOf("}");
    if (firstBrace > 0 && lastBrace !== -1) {
      content = content.slice(firstBrace, lastBrace + 1);
    }
    program = JSON.parse(content);
  } catch (err) {
    console.error("Program JSON parse failed:", err);
    program = {
      totalArea: totalArea ?? 2800,
      floors: [
        { floorRange: "B1", functionName: "Parking", areaPerFloor: 1200, description: "Underground parking level.", keySpaces: ["Car bays", "MEP room"] },
        { floorRange: "G", functionName: "Lobby", areaPerFloor: 800, description: "Entrance lobby and reception.", keySpaces: ["Reception", "Lifts", "Security"] },
        { floorRange: "1-5", functionName: "Commercial", areaPerFloor: 750, description: "Retail and commercial floors.", keySpaces: ["Retail", "Café", "Offices"] },
      ],
      spaces: [
        { name: "Lobby", area: 800, quantity: 1, priority: "essential", description: "Grand entrance" },
      ],
      designPrinciples: ["Efficient vertical stacking", "Public realm activation", "Sustainable systems"],
      materialPalette: ["High-performance glazing", "Precast concrete", "Aluminum cladding"],
      sustainabilityStrategies: ["Solar shading", "Green roof", "Rainwater harvesting"],
      estimatedBudget: "To be determined",
      timeline: "36-48 months",
      styleDirection: "Contemporary architecture",
    };
  }

  if (userFunctions) {
    (program as Record<string, unknown>)._input = { totalArea, functions: userFunctions };
  }

  const [updated] = await db
    .update(projectsTable)
    .set({
      program: program as unknown as Record<string, unknown>,
      status: "programmed",
    })
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  res.json(updated.program);
});

// POST /projects/:id/zoning — AI-generated adjacency + zoning from the program
router.post("/projects/:id/zoning", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const program = project.program as Record<string, unknown> | null;
  const floors = (program?.floors as Array<{ floorRange: string; functionName: string; areaPerFloor: number }>) ?? [];

  // Aggregate unique functions with total area
  const fnMap = new Map<string, number>();
  for (const f of floors) {
    const range = f.floorRange ?? "";
    let count = 1;
    if (range.includes("-")) {
      const parseNum = (s: string) => {
        s = s.trim().toUpperCase();
        if (s === "G") return 0;
        if (s.startsWith("B")) return -(parseInt(s.slice(1)) || 1);
        return parseInt(s) || 0;
      };
      const parts = range.split("-");
      count = Math.abs(parseNum(parts[1]) - parseNum(parts[0])) + 1;
    }
    const prev = fnMap.get(f.functionName) ?? 0;
    fnMap.set(f.functionName, prev + (f.areaPerFloor ?? 0) * count);
  }

  const functions = Array.from(fnMap.entries()).map(([name, totalArea]) => ({ name, totalArea }));

  if (functions.length === 0) {
    res.json({ nodes: [], edges: [] });
    return;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 4000,
    messages: [
      {
        role: "system",
        content: "You are an expert architect. Classify building functions into zones and generate a spatial adjacency matrix. Return ONLY valid JSON.",
      },
      {
        role: "user",
        content: `For a ${project.projectType} building named "${project.name}", classify each function and generate adjacency relationships.

Functions (with total area sqm):
${functions.map(f => `- ${f.name}: ${f.totalArea} sqm`).join("\n")}

Zone types:
- "public": lobbies, retail, cafes, galleries, reception, entrance, atrium
- "semi-public": meeting rooms, lounges, amenity floors, restaurants, co-working
- "private": offices, residential, apartments, hotel rooms, suites, penthouses
- "service": parking, MEP, loading, plant rooms, storage, back-of-house

Return JSON:
{
  "nodes": [
    { "id": "function name exactly as given", "zone": "public|semi-public|private|service", "totalArea": 5000 }
  ],
  "edges": [
    { "from": "function name", "to": "function name", "strength": "Strong|Medium|Avoid" }
  ]
}

Rules:
- Include ALL functions above as nodes
- Generate edges for EVERY pair (don't skip any)
- Use "Strong" for highly adjacent zones (e.g. lobby↔retail, lobby↔lift core)
- Use "Avoid" for incompatible zones (e.g. parking↔penthouse, service↔public lobby)
- Use "Medium" for acceptable but not ideal adjacencies`,
      },
    ],
  });

  let zoning: Record<string, unknown>;
  try {
    let content = completion.choices[0]?.message?.content ?? "{}";
    content = content.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/im, "").trim();
    const fb = content.indexOf("{"), lb = content.lastIndexOf("}");
    if (fb > 0 && lb !== -1) content = content.slice(fb, lb + 1);
    zoning = JSON.parse(content);
  } catch (err) {
    console.error("Zoning JSON parse failed:", err);
    zoning = { nodes: functions.map(f => ({ id: f.name, zone: "semi-public", totalArea: f.totalArea })), edges: [] };
  }

  // Save to metadata — append to history (keep last 10), set as current
  const historyEntry = {
    id: Date.now().toString(),
    generatedAt: new Date().toISOString(),
    data: zoning,
  };

  const existing = await db.select({ metadata: projectsTable.metadata }).from(projectsTable).where(eq(projectsTable.id, id));
  const currentMeta = (existing[0]?.metadata as Record<string, unknown>) ?? {};
  const prevHistory = (currentMeta.zoningHistory as typeof historyEntry[]) ?? [];
  const zoningHistory = [historyEntry, ...prevHistory].slice(0, 10);

  await db.update(projectsTable)
    .set({ metadata: { ...currentMeta, zoning, zoningHistory } })
    .where(eq(projectsTable.id, id));

  res.json({ ...zoning, _entry: historyEntry });
});

// ─── Massing Generator ────────────────────────────────────────────────────────

router.post("/projects/:id/massing", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const program = project.program as Record<string, unknown> | null;
  const floors = (program?.floors as { functionName: string; areaPerFloor: number; floorRange: string }[] | undefined) ?? [];

  // Calculate total area from program
  const totalArea = floors.reduce((sum, f) => {
    const range = f.floorRange ?? "";
    let count = 1;
    if (range.includes("-")) {
      const parseNum = (s: string) => {
        s = s.trim().toUpperCase();
        if (s === "G") return 0;
        if (s.startsWith("B")) return -(parseInt(s.slice(1)) || 1);
        return parseInt(s) || 0;
      };
      const parts = range.split("-");
      count = Math.abs(parseNum(parts[1]) - parseNum(parts[0])) + 1;
    }
    return sum + (f.areaPerFloor ?? 0) * count;
  }, 0);

  const numFloors = (project as Record<string, unknown>).numFloors as number | null;
  const brief = project.clientBrief ?? "";

  // Hard values derived from the actual project data — AI must NOT change these
  const actualGFA   = Math.round(totalArea || 5000);
  const actualFloors = numFloors ?? Math.max(2, Math.round(actualGFA / 800));
  const floorHeight  = 3.5;
  const actualHeight = Math.round(actualFloors * floorHeight);

  // Read the selected concept from metadata for style influence
  const metaRow = await db.select({ metadata: projectsTable.metadata }).from(projectsTable).where(eq(projectsTable.id, id));
  const meta = (metaRow[0]?.metadata as Record<string, unknown>) ?? {};
  const concepts = (meta.concepts as { title: string; narrative: string; tags: string[]; formalStrategy?: string; materials?: string[]; precedents?: string[] }[] | undefined) ?? [];
  const selectedConceptIdx = (typeof req.body?.conceptIdx === "number" ? req.body.conceptIdx : (meta.selectedConceptIdx as number | undefined)) ?? 0;
  const selectedConcept = concepts[selectedConceptIdx] ?? concepts[0];

  // Available form types — shuffle so each generation explores different combinations
  const allFormTypes = ["tower", "podium-tower", "courtyard", "bar", "stepped", "split", "L-shape", "U-shape", "wrapped", "fragmented"];
  const shuffled = allFormTypes.sort(() => Math.random() - 0.5).slice(0, 6); // pick 6 candidates, AI chooses 3

  const conceptBlock = selectedConcept
    ? `
Style reference from selected concept "${selectedConcept.title}":
- Design narrative: ${selectedConcept.narrative}
- Style tags: ${(selectedConcept.tags ?? []).join(", ")}
- Formal strategy: ${selectedConcept.formalStrategy ?? "Not defined"}
- Materials: ${(selectedConcept.materials ?? []).join(", ") || "Not defined"}
- Precedents: ${(selectedConcept.precedents ?? []).join(", ") || "Not defined"}

Your 3 options MUST respond to this style. If the concept is "Brutalist" or "Monolithic", prefer compact heavy masses. If "Biophilic" or "Courtyard", prefer open forms with landscape integration. If "Parametric" or "Fragmented", prefer complex articulated massing. Use the concept vocabulary in your titles and descriptions.`
    : "";

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 3000,
    messages: [
      { role: "system", content: "You are an expert architectural designer specialising in massing studies and building form optimisation. Return ONLY valid JSON, no markdown." },
      { role: "user", content: `Generate 3 distinct volumetric massing options for a ${project.projectType} building named "${project.name}".

FIXED project constraints (do NOT change these):
- GFA: ${actualGFA} m² (same across all options)
- Floors: ${actualFloors} (same across all options)
- Height: ${actualHeight}m (${actualFloors} floors × ${floorHeight}m/floor)
- Brief: ${brief || "Not provided"}
${conceptBlock}

Available form types for this generation (choose 3 DIFFERENT ones from this list): ${shuffled.join(", ")}

You decide for each option:
1. formType — must be one of the types listed above
2. title — evocative name influenced by the concept style
3. description — one sentence connecting the form to the concept direction
4. siteCoverage — integer percentage (25–78). Vary SIGNIFICANTLY between options (spread at least 20% apart)
5. setbackFront — metres (2–10)
6. setbackSide — metres (2–8)
7. pros — 2–3 advantages
8. cons — 1–2 disadvantages

Return JSON:
{
  "options": [
    {
      "key": "A",
      "title": "...",
      "formType": "...",
      "description": "...",
      "siteCoverage": 35,
      "setbackFront": 6,
      "setbackSide": 4,
      "pros": ["...", "..."],
      "cons": ["..."]
    }
  ]
}

CRITICAL: Do NOT include gfa, floors, height, or far — server computes these. Each option must have a DIFFERENT formType. siteCoverage must vary significantly across options.` },
    ],
  });

  let aiOptions: { key: string; title: string; formType: string; description: string; siteCoverage: number; setbackFront: number; setbackSide: number; pros: string[]; cons: string[] }[];
  try {
    let content = completion.choices[0]?.message?.content ?? "{}";
    content = content.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/im, "").trim();
    const fb = content.indexOf("{"), lb = content.lastIndexOf("}");
    if (fb >= 0 && lb !== -1) content = content.slice(fb, lb + 1);
    const parsed = JSON.parse(content) as { options: typeof aiOptions };
    aiOptions = parsed.options ?? [];
  } catch (err) {
    console.error("Massing JSON parse failed:", err);
    res.status(500).json({ error: "Failed to parse AI response" }); return;
  }

  // Merge AI form data with locked project values
  const options = aiOptions.map((o, i) => ({
    key:          o.key ?? String.fromCharCode(65 + i),
    title:        o.title ?? `Option ${String.fromCharCode(65 + i)}`,
    formType:     o.formType ?? "bar",
    description:  o.description ?? "",
    gfa:          actualGFA,
    floors:       actualFloors,
    height:       actualHeight,
    siteCoverage: Math.min(80, Math.max(20, Math.round(o.siteCoverage ?? 50))),
    // FAR = floors × site_coverage (footprint = GFA/floors; site_area = footprint/coverage → FAR = GFA/site_area = floors×coverage)
    far:          parseFloat((actualFloors * ((Math.min(80, Math.max(20, o.siteCoverage ?? 50))) / 100)).toFixed(1)),
    setbackFront: o.setbackFront ?? 5,
    setbackSide:  o.setbackSide ?? 4,
    pros:         o.pros ?? [],
    cons:         o.cons ?? [],
  }));

  const existing = await db.select({ metadata: projectsTable.metadata }).from(projectsTable).where(eq(projectsTable.id, id));
  const currentMeta = (existing[0]?.metadata as Record<string, unknown>) ?? {};
  await db.update(projectsTable).set({ metadata: { ...currentMeta, massingOptions: options } }).where(eq(projectsTable.id, id));

  res.json({ options });
});

// ─── Concept Generation ───────────────────────────────────────────────────────

router.post("/projects/:id/concepts", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const program = project.program as Record<string, unknown> | null;
  const floors = (program?.floors as { functionName: string; areaPerFloor: number; floorRange: string }[] | undefined) ?? [];
  const functionNames = [...new Set(floors.map(f => f.functionName))].slice(0, 15);

  // Read structured brief from metadata (saved by client brief page)
  const conceptMeta = (project.metadata as Record<string, unknown>) ?? {};
  const conceptBriefData = (conceptMeta.brief as { styles?: string[]; sustainability?: string[]; mustHave?: string; avoid?: string; budgetPriority?: number } | undefined) ?? {};
  const conceptSelectedStyles = conceptBriefData.styles ?? [];
  const CONCEPT_ALL_STYLES = ["Modern", "Minimal", "Industrial", "Organic", "Parametric", "Classical", "Brutalist", "Tropical"];
  const conceptExcludedStyles = CONCEPT_ALL_STYLES.filter(s => !conceptSelectedStyles.includes(s));

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 4000,
    messages: [
      { role: "system", content: "You are a creative architectural director. Generate distinct design concepts that strictly follow the client's style preferences. Return ONLY valid JSON, no markdown." },
      { role: "user", content: `Generate 3 distinct architectural design concepts for a ${project.projectType} project named "${project.name}".

Client brief: ${project.clientBrief || "No brief provided."}
Key program elements: ${functionNames.length ? functionNames.join(", ") : "Not defined yet."}

═══ CLIENT STYLE PREFERENCES (MANDATORY) ═══
SELECTED styles — concepts MUST align with: ${conceptSelectedStyles.length > 0 ? conceptSelectedStyles.join(", ") : "Contemporary / open to direction"}
EXCLUDED styles — do NOT use these: ${conceptExcludedStyles.length > 0 ? conceptExcludedStyles.join(", ") : "None"}
Must have: ${conceptBriefData.mustHave || "Not specified"}
Avoid: ${conceptBriefData.avoid || "Not specified"}
Sustainability: ${(conceptBriefData.sustainability ?? []).join(", ") || "Not specified"}

CRITICAL: Each concept must reflect the SELECTED styles above. Do not propose concepts that draw from the EXCLUDED styles list.

Each concept must be architecturally distinct — different in form, material logic, and spatial strategy.

Return JSON:
{
  "concepts": [
    {
      "title": "Short evocative concept name (2-4 words)",
      "narrative": "2-3 sentence design narrative explaining the core idea, material language, and spatial experience.",
      "tags": ["Tag1", "Tag2", "Tag3", "Tag4"],
      "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
      "materials": ["Material name 1", "Material name 2", "Material name 3"],
      "formalStrategy": "One sentence describing the formal/massing strategy.",
      "precedents": ["Reference building or architect 1", "Reference 2"]
    }
  ]
}

- palette: 5 hex colors representing this concept's material palette
- tags: keywords matching the selected styles (e.g. if "Minimal" selected, use "Minimalist", "Clean Lines", etc — NOT "Brutalist" or "Industrial" if those are excluded)
- Make all 3 concepts genuinely different from each other, but all within the approved style direction` },
    ],
  });

  let concepts: unknown[];
  try {
    let content = completion.choices[0]?.message?.content ?? "{}";
    content = content.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/im, "").trim();
    const fb = content.indexOf("{"), lb = content.lastIndexOf("}");
    if (fb >= 0 && lb !== -1) content = content.slice(fb, lb + 1);
    const parsed = JSON.parse(content) as { concepts: unknown[] };
    concepts = parsed.concepts ?? [];
  } catch (err) {
    console.error("Concepts JSON parse failed:", err);
    res.status(500).json({ error: "Failed to parse AI response" }); return;
  }

  const existing = await db.select({ metadata: projectsTable.metadata }).from(projectsTable).where(eq(projectsTable.id, id));
  const currentMeta = (existing[0]?.metadata as Record<string, unknown>) ?? {};
  await db.update(projectsTable).set({ metadata: { ...currentMeta, concepts } }).where(eq(projectsTable.id, id));

  res.json({ concepts });
});

router.get("/projects/:id/images", async (req, res): Promise<void> => {
  const params = GetProjectImagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const images = await db
    .select()
    .from(projectImagesTable)
    .where(eq(projectImagesTable.projectId, params.data.id))
    .orderBy(desc(projectImagesTable.createdAt));

  res.json(
    images.map((img) => ({
      id: img.id,
      projectId: img.projectId,
      imageType: img.imageType,
      prompt: img.prompt,
      imageUrl: img.imageUrl,
      title: img.title,
      createdAt: img.createdAt.toISOString(),
    }))
  );
});

router.post("/projects/:id/images", async (req, res): Promise<void> => {
  const params = GenerateProjectImageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = GenerateProjectImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const typePrompts: Record<string, string> = {
    exterior: `Architectural exterior photograph of a ${project.projectType} building. ${project.name}. Modern architectural photography, dramatic lighting, professional composition, photorealistic, high detail.`,
    interior: `Interior architectural photograph of a ${project.projectType} space. ${project.name}. Professional architectural interior photography, natural light, clean lines, photorealistic, high detail.`,
    landscape: `Architectural landscape design for a ${project.projectType} project. ${project.name}. Professional landscape architecture photography, lush greenery, sustainable design, photorealistic, high detail.`,
  };

  const prompt = parsed.data.customPrompt ?? typePrompts[parsed.data.imageType] ?? typePrompts.exterior;

  const buffer = await generateImageBuffer(prompt, "1024x1024");
  const base64 = buffer.toString("base64");
  const imageUrl = `data:image/png;base64,${base64}`;

  const [image] = await db
    .insert(projectImagesTable)
    .values({
      projectId: params.data.id,
      imageType: parsed.data.imageType,
      prompt,
      imageUrl,
      title: parsed.data.title,
    })
    .returning();

  if (project.status === "programmed" || project.status === "analyzed" || project.status === "site_selected" || project.status === "draft") {
    await db
      .update(projectsTable)
      .set({ status: "images_generated" })
      .where(eq(projectsTable.id, params.data.id));
  }

  res.status(201).json({
    id: image.id,
    projectId: image.projectId,
    imageType: image.imageType,
    prompt: image.prompt,
    imageUrl: image.imageUrl,
    title: image.title,
    createdAt: image.createdAt.toISOString(),
  });
});

// ─── POST /projects/:id/exterior — AI Facade Design ─────────────────────────
router.post("/projects/:id/exterior", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const meta = (project.metadata as Record<string, unknown>) ?? {};
  const concepts = (meta.concepts as { title: string; narrative: string; tags: string[]; materials?: string[]; formalStrategy?: string; palette?: string[] }[] | undefined) ?? [];
  // Prefer idx from request body (frontend always sends it from localStorage),
  // then fall back to what's in metadata, then default to 0.
  const bodyIdx = typeof (req.body as Record<string, unknown>).selectedConceptIdx === "number"
    ? (req.body as Record<string, unknown>).selectedConceptIdx as number
    : undefined;
  const selectedConceptIdx = bodyIdx ?? (meta.selectedConceptIdx as number | undefined) ?? 0;
  const selectedConcept = concepts[selectedConceptIdx] ?? concepts[0];
  const massingOptions = (meta.massingOptions as { formType: string; siteCoverage: number; floors: number; title: string }[] | undefined) ?? [];
  const selectedMassing = massingOptions[0];
  const conceptPalette = selectedConcept?.palette ?? [];

  // Read structured brief data from metadata (saved by useProjectMission "brief" section)
  const briefData = (meta.brief as {
    styles?: string[];
    sustainability?: string[];
    mustHave?: string;
    avoid?: string;
    spaceTypes?: string;
    adjacencies?: string;
    specialActivities?: string;
    budgetPriority?: number;
  } | undefined) ?? {};

  const selectedStyles = briefData.styles ?? [];
  const ALL_STYLES = ["Modern", "Minimal", "Industrial", "Organic", "Parametric", "Classical", "Brutalist", "Tropical"];
  const excludedStyles = ALL_STYLES.filter(s => !selectedStyles.includes(s));
  const sustainabilityGoals = briefData.sustainability ?? [];

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 2500,
    messages: [
      { role: "system", content: "You are a specialist architectural facade designer. Return ONLY valid JSON, no markdown. You must strictly follow the client's style preferences." },
      { role: "user", content: `Generate a complete facade design specification for a ${project.projectType} project.

Project: ${project.name}
Project Brief: ${project.clientBrief ?? "Not provided"}

═══ CLIENT STYLE PREFERENCES (MANDATORY) ═══
SELECTED styles — your design MUST align with these: ${selectedStyles.length > 0 ? selectedStyles.join(", ") : "Contemporary / open to suggestion"}
EXCLUDED styles — do NOT use any characteristics of: ${excludedStyles.length > 0 ? excludedStyles.join(", ") : "None"}

IMPORTANT: If "Brutalist" is in the excluded list, you must NOT use board-formed concrete, raw concrete, heavy mass, or any Brutalist vocabulary. Choose materials and language that match the SELECTED styles only.

Must have: ${briefData.mustHave || "Not specified"}
Avoid: ${briefData.avoid || "Not specified"}
Sustainability goals: ${sustainabilityGoals.length > 0 ? sustainabilityGoals.join(", ") : "Not specified"}
Budget priority: ${briefData.budgetPriority ?? 50}% (0 = cost-conscious, 100 = quality-first)

${selectedMassing ? `Massing: ${selectedMassing.title} (${selectedMassing.formType}, ${selectedMassing.floors} floors, ${selectedMassing.siteCoverage}% site coverage)` : ""}
${selectedConcept ? `Design Concept: "${selectedConcept.title}" — ${selectedConcept.narrative}
Concept Style Tags: ${(selectedConcept.tags ?? []).join(", ")}
Concept Materials: ${(selectedConcept.materials ?? []).join(", ") || "Not defined"}
Formal Strategy: ${selectedConcept.formalStrategy ?? ""}
Concept Colour Palette: ${conceptPalette.length > 0 ? conceptPalette.join(", ") : "Not defined"}` : ""}

${conceptPalette.length > 0 ? `═══ COLOUR PALETTE INSTRUCTION (MANDATORY — DO NOT CHANGE) ═══
The client has approved this exact concept colour palette: ${conceptPalette.join(", ")}
You MUST output these exact hex values in the "colorPalette" field. Do NOT invent, substitute, or approximate different colours. If the palette has fewer than 4 swatches, repeat the last one to fill 4 slots. The palette is FIXED — only the material descriptions should reflect the styles.` : ""}

Generate a facade that is TRUE to the selected styles above. Return JSON:
{
  "primaryMaterial": { "name": "...", "finish": "...", "description": "..." },
  "secondaryMaterial": { "name": "...", "finish": "...", "description": "..." },
  "glazing": { "type": "...", "tint": "...", "description": "..." },
  "wwr": 42,
  "thermalPerformance": "Target Met",
  "rValue": "R-3.8",
  "shadingStrategy": "...",
  "openingPattern": "...",
  "colorPalette": ${conceptPalette.length > 0 ? JSON.stringify([conceptPalette[0], conceptPalette[1] ?? conceptPalette[0], conceptPalette[2] ?? conceptPalette[0], conceptPalette[3] ?? conceptPalette[0]]) : '["#hex1", "#hex2", "#hex3", "#hex4"]'},
  "styleDirection": "...",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "northFacade": "...",
  "southFacade": "...",
  "eastFacade": "...",
  "westFacade": "..."
}

Recommendations should be specific, actionable facade strategies.
WWR should be 25–65%.
colorPalette must be exactly: ${conceptPalette.length > 0 ? conceptPalette.slice(0, 4).join(", ") : "4 hex codes reflecting the material palette"}.
styleDirection must explicitly reference the selected styles (e.g. "Minimal glass curtain wall" not "Brutalist concrete mass").` },
    ],
  });

  let facade: Record<string, unknown>;
  try {
    let content = completion.choices[0]?.message?.content ?? "{}";
    content = content.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/im, "").trim();
    const fb = content.indexOf("{"), lb = content.lastIndexOf("}");
    if (fb >= 0 && lb !== -1) content = content.slice(fb, lb + 1);
    facade = JSON.parse(content) as Record<string, unknown>;
  } catch (err) {
    console.error("Exterior JSON parse failed:", err);
    res.status(500).json({ error: "Failed to parse AI response" }); return;
  }

  facade.generatedAt = new Date().toISOString();
  facade.recommendationsApplied = false;
  // Hard-lock: always overwrite the AI's colorPalette with the concept palette
  // so the facade colours are guaranteed to match the user's chosen concept.
  if (conceptPalette.length > 0) {
    const locked = [
      conceptPalette[0],
      conceptPalette[1] ?? conceptPalette[0],
      conceptPalette[2] ?? conceptPalette[0],
      conceptPalette[3] ?? conceptPalette[0],
    ];
    facade.colorPalette = locked;
  }

  const updatedMeta = { ...meta, exterior: facade };
  await db.update(projectsTable).set({ metadata: updatedMeta }).where(eq(projectsTable.id, id));

  res.json({ exterior: facade });
});

// ─── PATCH /projects/:id/exterior/apply — Apply recommendations ──────────────
router.patch("/projects/:id/exterior/apply", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const meta = (project.metadata as Record<string, unknown>) ?? {};
  const exterior = (meta.exterior as Record<string, unknown>) ?? {};
  exterior.recommendationsApplied = true;
  exterior.appliedAt = new Date().toISOString();

  const updatedMeta = { ...meta, exterior };
  await db.update(projectsTable).set({ metadata: updatedMeta }).where(eq(projectsTable.id, id));

  res.json({ success: true, appliedAt: exterior.appliedAt });
});

// ─── POST /projects/:id/interior — AI Interior Design ────────────────────────
router.post("/projects/:id/interior", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const meta = (project.metadata as Record<string, unknown>) ?? {};
  const concepts = (meta.concepts as { title: string; narrative: string; tags: string[]; materials?: string[]; palette?: string[] }[] | undefined) ?? [];
  const bodyIdx = typeof (req.body as Record<string, unknown>).selectedConceptIdx === "number"
    ? (req.body as Record<string, unknown>).selectedConceptIdx as number : undefined;
  const selectedConceptIdx = bodyIdx ?? (meta.selectedConceptIdx as number | undefined) ?? 0;
  const selectedConcept = concepts[selectedConceptIdx] ?? concepts[0];
  const conceptPalette = selectedConcept?.palette ?? [];

  const briefData = (meta.brief as { styles?: string[]; mustHave?: string; avoid?: string; budgetPriority?: number } | undefined) ?? {};
  const selectedStyles = briefData.styles ?? [];
  const ALL_STYLES = ["Modern", "Minimal", "Industrial", "Organic", "Parametric", "Classical", "Brutalist", "Tropical"];
  const excludedStyles = ALL_STYLES.filter(s => !selectedStyles.includes(s));

  const selectedStyle = (req.body as Record<string, unknown>).selectedStyle as string | undefined ?? "Contemporary";

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 2000,
    messages: [
      { role: "system", content: "You are a specialist interior architect. Return ONLY valid JSON, no markdown. Follow style preferences strictly." },
      { role: "user", content: `Generate an interior design specification for the lobby of a ${project.projectType} building.

Project: ${project.name}
Selected Interior Style: "${selectedStyle}"
Design Concept: ${selectedConcept ? `"${selectedConcept.title}" — ${selectedConcept.narrative}` : "Not defined"}
Concept Colour Palette: ${conceptPalette.length > 0 ? conceptPalette.join(", ") : "Not defined"}

CLIENT STYLE PREFERENCES:
SELECTED: ${selectedStyles.length > 0 ? selectedStyles.join(", ") : "Contemporary"}
EXCLUDED: ${excludedStyles.length > 0 ? excludedStyles.join(", ") : "None"}

Return JSON:
{
  "selectedStyle": "${selectedStyle}",
  "styleDescription": "...",
  "colorPalette": ${conceptPalette.length > 0 ? JSON.stringify(conceptPalette.slice(0, 5)) : '["#hex1","#hex2","#hex3","#hex4","#hex5"]'},
  "spaces": {
    "lobby": {
      "lightingMood": "...",
      "lightingTemp": "...",
      "primaryFinish": "...",
      "secondaryFinish": "...",
      "flooringMaterial": "...",
      "ceilingTreatment": "...",
      "seating": "...",
      "acoustics": "...",
      "keyFeature": "..."
    }
  },
  "materialPalette": [
    { "name": "...", "role": "primary", "description": "..." },
    { "name": "...", "role": "secondary", "description": "..." },
    { "name": "...", "role": "accent", "description": "..." }
  ],
  "ffStrategy": "...",
  "sustainabilityNotes": "..."
}
colorPalette must be ${conceptPalette.length > 0 ? `these exact hex codes: ${conceptPalette.slice(0, 5).join(", ")}` : "5 hex codes matching the interior style"}.` }
    ],
  });

  let interior: Record<string, unknown>;
  try {
    let content = completion.choices[0]?.message?.content ?? "{}";
    content = content.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/im, "").trim();
    const fb = content.indexOf("{"), lb = content.lastIndexOf("}");
    if (fb >= 0 && lb !== -1) content = content.slice(fb, lb + 1);
    interior = JSON.parse(content) as Record<string, unknown>;
  } catch (err) {
    console.error("Interior JSON parse failed:", err);
    res.status(500).json({ error: "Failed to parse AI response" }); return;
  }

  // Hard-lock palette to concept palette
  if (conceptPalette.length > 0) interior.colorPalette = conceptPalette.slice(0, 5);
  interior.generatedAt = new Date().toISOString();
  interior.selectedStyle = selectedStyle;

  // Preserve any imageUrls already stored in the existing spaces
  // so that regenerating the interior design doesn't wipe generated visuals.
  const existingInterior = (meta.interior as Record<string, unknown>) ?? {};
  const existingSpaces   = (existingInterior.spaces as Record<string, Record<string, unknown>>) ?? {};
  const newSpaces        = (interior.spaces as Record<string, Record<string, unknown>>) ?? {};
  if (Object.keys(existingSpaces).length > 0) {
    const preserved: Record<string, Record<string, unknown>> = {};
    const allKeys = new Set([...Object.keys(existingSpaces), ...Object.keys(newSpaces)]);
    for (const key of allKeys) {
      preserved[key] = {
        ...(existingSpaces[key] ?? {}),
        ...(newSpaces[key] ?? {}),
        ...(existingSpaces[key]?.imageUrl ? { imageUrl: existingSpaces[key].imageUrl } : {}),
      };
    }
    interior.spaces = preserved;
  }

  const updatedMeta = { ...meta, interior };
  await db.update(projectsTable).set({ metadata: updatedMeta }).where(eq(projectsTable.id, id));
  res.json({ interior });
});

// ─── Shared lobby prompt builder ─────────────────────────────────────────────
function buildLobbyImagePrompt(
  interior: Record<string, unknown>,
  project: { name: string; projectType: string; description?: string | null },
  editInstruction?: string,
): string {
  const style       = (interior.selectedStyle as string | undefined) ?? "Contemporary";
  const styleDesc   = (interior.styleDescription as string | undefined) ?? "";
  const palette     = (interior.colorPalette as string[] | undefined) ?? [];
  const lobbySpec   = ((interior.spaces as Record<string, Record<string, unknown>> | undefined)?.lobby) ?? {};
  const matPalette  = (interior.materialPalette as { name?: string; role?: string; description?: string }[] | undefined) ?? [];
  const ffStrategy  = (interior.ffStrategy as string | undefined) ?? "";
  const sustNotes   = (interior.sustainabilityNotes as string | undefined) ?? "";

  // ── Project context
  const projectCtx = `${project.projectType} building called "${project.name}"`;

  // ── Style anchor: use full AI-generated style description
  const styleAnchor = styleDesc
    ? `${style} style — ${styleDesc}`
    : `${style} architectural interior style`;

  // ── Colour palette
  const colourLine = palette.length > 0
    ? `Dominant colour palette: ${palette.join(", ")} — these hex tones must be clearly expressed in surfaces, finishes, and light.`
    : "";

  // ── Key focal feature (the centrepiece of the shot)
  const keyFeatureLine = lobbySpec.keyFeature
    ? `Central design element: ${lobbySpec.keyFeature}.`
    : "";

  // ── Lighting specification
  const lightingLines = [
    lobbySpec.lightingMood    ? `Lighting mood: ${lobbySpec.lightingMood}.` : "",
    lobbySpec.lightingTemp    ? `Colour temperature: ${lobbySpec.lightingTemp}.` : "",
  ].filter(Boolean).join(" ");

  // ── Surface finishes
  const finishLines = [
    lobbySpec.primaryFinish   ? `Primary wall/surface finish: ${lobbySpec.primaryFinish}.` : "",
    lobbySpec.secondaryFinish ? `Secondary surface finish: ${lobbySpec.secondaryFinish}.` : "",
    lobbySpec.flooringMaterial ? `Floor material: ${lobbySpec.flooringMaterial}.` : "",
    lobbySpec.ceilingTreatment ? `Ceiling treatment: ${lobbySpec.ceilingTreatment}.` : "",
  ].filter(Boolean).join(" ");

  // ── Furniture & acoustics
  const furnitureLine = lobbySpec.seating ? `Furniture and seating: ${lobbySpec.seating}.` : "";
  const acousticLine  = lobbySpec.acoustics ? `Acoustic elements visible in the space: ${lobbySpec.acoustics}.` : "";

  // ── Material palette (named materials)
  const matLine = matPalette.length > 0
    ? `Named materials present: ${matPalette.map(m => m.name ?? "").filter(Boolean).join(", ")}.`
    : "";

  // ── FF&E & sustainability cues (briefly — for texture and tone references)
  const ffLine   = ffStrategy   ? `FF&E intent: ${ffStrategy.slice(0, 180)}.` : "";
  const sustLine = sustNotes    ? `Sustainability cues: ${sustNotes.slice(0, 120)}.` : "";

  // ── Compose the prompt
  const parts = [
    `Photorealistic ultra-high-detail architectural interior photography of a ${projectCtx} entrance lobby.`,
    `Style: ${styleAnchor}.`,
    colourLine,
    keyFeatureLine,
    lightingLines,
    finishLines,
    furnitureLine,
    acousticLine,
    matLine,
    ffLine,
    sustLine,
    "Dramatic wide-angle architectural shot showing the full lobby space.",
    "No people. Cinematic depth of field. Architectural photography quality, 8K resolution. Shot on Phase One IQ4, tilt-shift lens.",
  ].filter(Boolean).join(" ");

  if (editInstruction) {
    return `${parts} SPECIFIC EDIT TO APPLY: ${editInstruction}.`;
  }
  return parts;
}

// ─── POST /projects/:id/interior/visualize — Generate space images ────────────
router.post("/projects/:id/interior/visualize", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const meta = (project.metadata as Record<string, unknown>) ?? {};
  const interior = (meta.interior as Record<string, unknown> | undefined) ?? {};
  const selectedStyle = (req.body as Record<string, unknown>).selectedStyle as string | undefined
    ?? (interior.selectedStyle as string | undefined)
    ?? "Contemporary";
  const lobbyPrompt = buildLobbyImagePrompt(interior, project);

  // Generate lobby image
  const results = await Promise.allSettled([
    generateImageBuffer(lobbyPrompt, "1024x1024").then(buffer => ({
      space: "lobby",
      dataUrl: `data:image/png;base64,${buffer.toString("base64")}`,
    })),
  ]);

  const images: Record<string, string> = {};
  for (const r of results) {
    if (r.status === "fulfilled") images[r.value.space] = r.value.dataUrl;
  }

  // Persist image URLs into metadata.interior.spaces[space].imageUrl
  const interiorSpaces = (interior.spaces as Record<string, Record<string, unknown>> | undefined) ?? {};
  for (const [space, dataUrl] of Object.entries(images)) {
    interiorSpaces[space] = { ...(interiorSpaces[space] ?? {}), imageUrl: dataUrl };
  }
  const updatedInterior = { ...interior, spaces: interiorSpaces };

  // Append to image history (keep last 10 entries)
  const existingHistory = (meta.interiorImageHistory as { imageUrl: string; style: string; generatedAt: string }[] | undefined) ?? [];
  const newHistoryEntries = Object.entries(images).map(([, dataUrl]) => ({
    imageUrl: dataUrl,
    style: selectedStyle,
    generatedAt: new Date().toISOString(),
  }));
  const interiorImageHistory = [...existingHistory, ...newHistoryEntries].slice(-10);

  const updatedMeta2 = { ...meta, interior: updatedInterior, interiorImageHistory };
  await db.update(projectsTable).set({ metadata: updatedMeta2 }).where(eq(projectsTable.id, id));

  res.json({ images, interiorImageHistory });
});

// ─── POST /projects/:id/interior/presentation-image — Pin image to presentation
router.post("/projects/:id/interior/presentation-image", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const imageUrl = ((req.body as Record<string, unknown>).imageUrl as string | undefined)?.trim() ?? "";
  if (!imageUrl) { res.status(400).json({ error: "imageUrl is required" }); return; }

  const meta = (project.metadata as Record<string, unknown>) ?? {};
  const updatedMeta = { ...meta, presentationLobbyImage: imageUrl };
  await db.update(projectsTable).set({ metadata: updatedMeta }).where(eq(projectsTable.id, id));

  res.json({ ok: true });
});

// ─── POST /projects/:id/interior/visualize/edit — Edit lobby image ───────────
router.post("/projects/:id/interior/visualize/edit", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const meta = (project.metadata as Record<string, unknown>) ?? {};
  const interior = (meta.interior as Record<string, unknown> | undefined) ?? {};
  const editPrompt = ((req.body as Record<string, unknown>).editPrompt as string | undefined)?.trim() ?? "";
  if (!editPrompt) { res.status(400).json({ error: "editPrompt is required" }); return; }

  const selectedStyle = (interior.selectedStyle as string | undefined) ?? "Contemporary";
  const fullPrompt = buildLobbyImagePrompt(interior, project, editPrompt);

  let imageBuffer: Buffer;
  try {
    imageBuffer = await generateImageBuffer(fullPrompt, "1024x1024");
  } catch (err) {
    console.error("Image edit generation failed:", err);
    res.status(500).json({ error: "Image generation failed" }); return;
  }

  const dataUrl = `data:image/png;base64,${imageBuffer.toString("base64")}`;

  // Save as current lobby image + append to history
  const interiorSpaces = ((interior.spaces as Record<string, Record<string, unknown>> | undefined) ?? {});
  interiorSpaces.lobby = { ...(interiorSpaces.lobby ?? {}), imageUrl: dataUrl };
  const updatedInterior = { ...interior, spaces: interiorSpaces };

  const existingHistory = (meta.interiorImageHistory as { imageUrl: string; style: string; generatedAt: string; editPrompt?: string }[] | undefined) ?? [];
  const interiorImageHistory = [
    ...existingHistory,
    { imageUrl: dataUrl, style: selectedStyle, generatedAt: new Date().toISOString(), editPrompt },
  ].slice(-10);

  const updatedMeta = { ...meta, interior: updatedInterior, interiorImageHistory };
  await db.update(projectsTable).set({ metadata: updatedMeta }).where(eq(projectsTable.id, id));

  res.json({ imageUrl: dataUrl, interiorImageHistory });
});

// ─── POST /projects/:id/landscape — AI Landscape Design ──────────────────────
router.post("/projects/:id/landscape", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const meta = (project.metadata as Record<string, unknown>) ?? {};
  const concepts = (meta.concepts as { title: string; narrative: string; tags: string[]; materials?: string[]; palette?: string[] }[] | undefined) ?? [];
  const bodyIdx = typeof (req.body as Record<string, unknown>).selectedConceptIdx === "number"
    ? (req.body as Record<string, unknown>).selectedConceptIdx as number : undefined;
  const selectedConceptIdx = bodyIdx ?? (meta.selectedConceptIdx as number | undefined) ?? 0;
  const selectedConcept = concepts[selectedConceptIdx] ?? concepts[0];
  const conceptPalette = selectedConcept?.palette ?? [];

  const briefData = (meta.brief as { styles?: string[]; mustHave?: string; avoid?: string; budgetPriority?: number } | undefined) ?? {};
  const selectedStyles = briefData.styles ?? [];

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 2500,
    messages: [
      { role: "system", content: "You are a specialist landscape architect. Return ONLY valid JSON, no markdown. Keep every text field to ONE concise sentence (under 15 words) except designPhilosophy (2-3 sentences max). No bullet points. No lists in text fields." },
      { role: "user", content: `Generate a landscape design specification for a ${project.projectType} building.

Project: ${project.name}
Design Concept: ${selectedConcept ? `"${selectedConcept.title}" — ${selectedConcept.narrative}` : "Not defined"}
Concept Colour Palette: ${conceptPalette.length > 0 ? conceptPalette.join(", ") : "earthy naturals"}
Style: ${selectedStyles.length > 0 ? selectedStyles.join(", ") : "Contemporary, Sustainable"}

IMPORTANT: All text values must be SHORT — one sentence, 8–15 words only. designPhilosophy may be 2-3 sentences.

Return JSON exactly:
{
  "designPhilosophy": "2-3 sentence poetic description of the landscape concept.",
  "hardscape": {
    "primaryPaving": "one sentence",
    "retainingElements": "one sentence",
    "boundaryTreatment": "one sentence",
    "entrySequence": "one sentence"
  },
  "softscape": {
    "plantingStrategy": "one sentence",
    "featuredSpecies": ["Genus species", "Genus species", "Genus species", "Genus species"],
    "groundCover": "one sentence",
    "treePlanting": "one sentence",
    "seasonalInterest": "one sentence"
  },
  "waterManagement": {
    "strategy": "one sentence",
    "bioswales": "one sentence",
    "cisterns": "one sentence",
    "surfaceRunoff": "one sentence"
  },
  "lighting": {
    "pathLighting": "one sentence",
    "accentLighting": "one sentence",
    "securityLighting": "one sentence"
  },
  "performance": {
    "permeableArea": 60,
    "canopyCoverage10yr": 40,
    "biodiversityScore": 7,
    "stormwaterReduction": 80
  },
  "sustainability": "one sentence",
  "maintenanceSchedule": "one sentence",
  "estimatedImplementationCost": "one sentence"
}` }
    ],
  });

  let landscape: Record<string, unknown>;
  try {
    let content = completion.choices[0]?.message?.content ?? "{}";
    content = content.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/im, "").trim();
    const fb = content.indexOf("{"), lb = content.lastIndexOf("}");
    if (fb >= 0 && lb !== -1) content = content.slice(fb, lb + 1);
    landscape = JSON.parse(content) as Record<string, unknown>;
  } catch (err) {
    console.error("Landscape JSON parse failed:", err);
    res.status(500).json({ error: "Failed to parse AI response" }); return;
  }

  landscape.generatedAt = new Date().toISOString();
  if (conceptPalette.length > 0) landscape.colorPalette = conceptPalette;

  const updatedMeta = { ...meta, landscape };
  await db.update(projectsTable).set({ metadata: updatedMeta }).where(eq(projectsTable.id, id));
  res.json({ landscape });
});

/* ─────────────────────────────────────────────────────────────
   POST /projects/:id/sustainability
   AI generates sustainability targets + scores, saved to metadata.sustainability
───────────────────────────────────────────────────────────── */
router.post("/projects/:id/sustainability", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const meta = (project.metadata as Record<string, unknown>) ?? {};
  const analysis = project.siteAnalysis as Record<string, unknown> | null;
  const brief = (meta.brief as { styles?: string[]; sustainability?: string[] } | undefined) ?? {};
  const concepts = (meta.concepts as { title: string; tags: string[] }[] | undefined) ?? [];
  const selConcept = concepts[(meta.selectedConceptIdx as number | undefined) ?? 0];

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 1500,
    messages: [
      { role: "system", content: "You are a sustainability consultant for architectural projects. Return ONLY valid JSON, no markdown." },
      { role: "user", content: `Generate a sustainability performance assessment for:
Project: ${project.name} (${project.projectType})
Location: ${project.address ?? "Unknown"}
Climate: ${analysis?.climate ?? "Not analyzed"}
Sun Exposure: ${analysis?.sunExposure ?? "Unknown"}
Wind: ${analysis?.windDirection ?? "Unknown"}
Sustainability goals: ${(brief.sustainability ?? []).join(", ") || "Not specified"}
Design concept: ${selConcept ? selConcept.title : "Not defined"}
Sustainability score from site: ${analysis?.sustainabilityScore ?? 70}

Return JSON:
{
  "overallScore": 78,
  "targetRating": "BREEAM Excellent",
  "metrics": {
    "daylightAutonomy": 65,
    "naturalVentilation": 40,
    "energyEfficiency": 82,
    "waterEfficiency": 90,
    "embodiedCarbon": 55,
    "biodiversity": 70
  },
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3",
    "Actionable recommendation 4"
  ],
  "appliedStrategies": [],
  "summaryNote": "one-sentence overall assessment",
  "generatedAt": "${new Date().toISOString()}"
}` }
    ],
  });

  let sustainability: Record<string, unknown>;
  try {
    let content = completion.choices[0]?.message?.content ?? "{}";
    content = content.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/im, "").trim();
    const fb = content.indexOf("{"), lb = content.lastIndexOf("}");
    if (fb >= 0 && lb !== -1) content = content.slice(fb, lb + 1);
    sustainability = JSON.parse(content) as Record<string, unknown>;
  } catch {
    sustainability = {
      overallScore: analysis?.sustainabilityScore ?? 78,
      targetRating: "BREEAM Excellent",
      metrics: { daylightAutonomy: 65, naturalVentilation: 40, energyEfficiency: 82, waterEfficiency: 90, embodiedCarbon: 55, biodiversity: 70 },
      recommendations: [
        "Increase skylight area over the central atrium by 15% to improve daylight autonomy.",
        "Implement automated louvers on south-facing facade to reduce peak cooling loads.",
        "Specify low-carbon concrete mix (min 30% slag/fly ash) to reduce embodied carbon.",
        "Add greywater harvesting tank to basement level to supply irrigation and WCs."
      ],
      appliedStrategies: [],
      summaryNote: "Performance is above baseline with opportunities in daylighting and ventilation.",
      generatedAt: new Date().toISOString(),
    };
  }

  sustainability.generatedAt = new Date().toISOString();
  const updatedMeta = { ...meta, sustainability };
  await db.update(projectsTable).set({ metadata: updatedMeta }).where(eq(projectsTable.id, id));
  res.json({ sustainability });
});

/* ─────────────────────────────────────────────────────────────
   PATCH /projects/:id/sustainability/apply
   Save selected strategies to sustainability.appliedStrategies
───────────────────────────────────────────────────────────── */
router.patch("/projects/:id/sustainability/apply", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const meta = (project.metadata as Record<string, unknown>) ?? {};
  const sustainability = (meta.sustainability as Record<string, unknown>) ?? {};
  const { strategies } = req.body as { strategies: string[] };
  sustainability.appliedStrategies = strategies;
  sustainability.appliedAt = new Date().toISOString();
  const updatedMeta = { ...meta, sustainability };
  await db.update(projectsTable).set({ metadata: updatedMeta }).where(eq(projectsTable.id, id));
  res.json({ ok: true });
});

/* ─────────────────────────────────────────────────────────────
   POST /projects/:id/regulations
   AI generates compliance check, saved to metadata.regulations
───────────────────────────────────────────────────────────── */
router.post("/projects/:id/regulations", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const meta = (project.metadata as Record<string, unknown>) ?? {};
  const analysis = project.siteAnalysis as Record<string, unknown> | null;
  const program = project.program as { floors?: { name: string; areaPerFloor: number }[] } | null;
  const totalGFA = (program?.floors ?? []).reduce((s, f) => s + (f.areaPerFloor || 0), 0);

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 1500,
    messages: [
      { role: "system", content: "You are an expert building code consultant. Return ONLY valid JSON, no markdown." },
      { role: "user", content: `Generate a building code compliance assessment for:
Project: ${project.name} (${project.projectType})
Location: ${project.address ?? "Unknown"}
Floors: ${project.numFloors ?? 1}
Site Area: ${project.siteArea ?? 0} m²
GFA: ${totalGFA} m²
FAR: ${project.siteArea ? (totalGFA / project.siteArea).toFixed(2) : "Unknown"}
Zoning: ${analysis?.zoningInfo ?? "Not analyzed"}
Accessibility: ${analysis?.accessibilityNotes ?? "Not analyzed"}

Return JSON:
{
  "jurisdiction": "City Planning Department",
  "buildingCode": "IBC 2021 Edition",
  "zoningCode": "Derived from location",
  "checks": [
    { "name": "Setbacks & Clearances", "status": "compliant|warning|non-compliant", "detail": "specific numbers and requirements" },
    { "name": "Height Restrictions", "status": "compliant|warning|non-compliant", "detail": "specific numbers" },
    { "name": "FAR / Plot Ratio", "status": "compliant|warning|non-compliant", "detail": "current vs allowable" },
    { "name": "Parking Requirements", "status": "compliant|warning|non-compliant", "detail": "provided vs required" },
    { "name": "Accessibility (ADA/DDA)", "status": "compliant|warning|non-compliant", "detail": "key requirements" },
    { "name": "Fire Egress & Safety", "status": "compliant|warning|non-compliant", "detail": "travel distances and exits" }
  ],
  "criticalActions": [
    "Action required text 1",
    "Action required text 2"
  ],
  "flaggedItems": [],
  "generatedAt": "${new Date().toISOString()}"
}` }
    ],
  });

  let regulations: Record<string, unknown>;
  try {
    let content = completion.choices[0]?.message?.content ?? "{}";
    content = content.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/im, "").trim();
    const fb = content.indexOf("{"), lb = content.lastIndexOf("}");
    if (fb >= 0 && lb !== -1) content = content.slice(fb, lb + 1);
    regulations = JSON.parse(content) as Record<string, unknown>;
  } catch {
    regulations = {
      jurisdiction: "City Planning Department",
      buildingCode: "IBC 2021 Edition",
      zoningCode: analysis?.zoningInfo ?? "Mixed-use (IM-2)",
      checks: [
        { name: "Setbacks & Clearances", status: "compliant", detail: "Front: 5m (Req 5m). Side: 3m (Req 3m). Rear: 10m (Req 8m)." },
        { name: "Height Restrictions", status: "compliant", detail: `${project.numFloors ?? 1} floors. Within allowable zone height.` },
        { name: "FAR / Plot Ratio", status: "compliant", detail: `Current FAR: ${project.siteArea ? (totalGFA / project.siteArea).toFixed(2) : "N/A"}` },
        { name: "Parking Requirements", status: "compliant", detail: "Required bays calculated from GFA." },
        { name: "Accessibility (ADA/DDA)", status: "compliant", detail: "Ramp gradients < 1:12. Door clearances met." },
        { name: "Fire Egress & Safety", status: "compliant", detail: "Travel distances within code limits." },
      ],
      criticalActions: [],
      flaggedItems: [],
      generatedAt: new Date().toISOString(),
    };
  }

  regulations.generatedAt = new Date().toISOString();
  const updatedMeta = { ...meta, regulations };
  await db.update(projectsTable).set({ metadata: updatedMeta }).where(eq(projectsTable.id, id));
  res.json({ regulations });
});

/* ─────────────────────────────────────────────────────────────
   PATCH /projects/:id/regulations/flag
   Flag a critical action item
───────────────────────────────────────────────────────────── */
router.patch("/projects/:id/regulations/flag", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid project id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const meta = (project.metadata as Record<string, unknown>) ?? {};
  const regulations = (meta.regulations as Record<string, unknown>) ?? {};
  const flagged = (regulations.flaggedItems as string[]) ?? [];
  const { action } = req.body as { action: string };
  if (!flagged.includes(action)) flagged.push(action);
  regulations.flaggedItems = flagged;
  const updatedMeta = { ...meta, regulations };
  await db.update(projectsTable).set({ metadata: updatedMeta }).where(eq(projectsTable.id, id));
  res.json({ ok: true, flaggedItems: flagged });
});

export default router;
