import { Router, type IRouter } from "express";
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
  const updated = { ...current, [section]: data };

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
    const content = completion.choices[0]?.message?.content ?? "{}";
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
    max_completion_tokens: 4000,
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
    const content = completion.choices[0]?.message?.content ?? "{}";
    program = JSON.parse(content);
  } catch {
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

export default router;
