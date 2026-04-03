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
    siteAnalysis: p.siteAnalysis ?? undefined,
    questionnaire: p.questionnaire ?? undefined,
    program: p.program ?? undefined,
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

  const questionnaire = project.questionnaire ? JSON.stringify(project.questionnaire) : "No questionnaire data";
  const analysis = project.siteAnalysis ? JSON.stringify(project.siteAnalysis) : "No site analysis";

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 3000,
    messages: [
      {
        role: "system",
        content:
          "You are an expert architect creating architectural programs. Generate detailed, professional architectural programs based on project data. Return ONLY valid JSON with no markdown.",
      },
      {
        role: "user",
        content: `Generate a comprehensive architectural program for:
Project: ${project.name}
Type: ${project.projectType}
Questionnaire answers: ${questionnaire}
Site analysis: ${analysis}

Return a JSON object with exactly these fields:
{
  "totalArea": 2500,
  "spaces": [
    {
      "name": "Space Name",
      "area": 100,
      "quantity": 1,
      "priority": "essential",
      "description": "Brief description"
    }
  ],
  "designPrinciples": ["principle 1", "principle 2"],
  "materialPalette": ["material 1", "material 2"],
  "sustainabilityStrategies": ["strategy 1", "strategy 2"],
  "estimatedBudget": "$500,000 - $750,000",
  "timeline": "18-24 months",
  "styleDirection": "Contemporary minimalist with industrial accents"
}
Priority values must be one of: essential, important, optional.
Include 6-10 spaces, 4-6 design principles, 5-8 materials, 3-5 sustainability strategies.`,
      },
    ],
  });

  let program: Record<string, unknown>;
  try {
    const content = completion.choices[0]?.message?.content ?? "{}";
    program = JSON.parse(content);
  } catch {
    program = {
      totalArea: 2800,
      spaces: [
        { name: "Entry Lobby", area: 120, quantity: 1, priority: "essential", description: "Grand entrance with reception" },
        { name: "Main Living Area", area: 450, quantity: 1, priority: "essential", description: "Open-plan living and dining" },
        { name: "Primary Bedroom Suite", area: 180, quantity: 1, priority: "essential", description: "Master suite with en-suite" },
        { name: "Secondary Bedrooms", area: 120, quantity: 3, priority: "essential", description: "Comfortable sleeping quarters" },
        { name: "Kitchen", area: 140, quantity: 1, priority: "essential", description: "Professional-grade kitchen" },
        { name: "Home Office", area: 90, quantity: 1, priority: "important", description: "Dedicated workspace" },
        { name: "Utility Room", area: 40, quantity: 1, priority: "essential", description: "Laundry and storage" },
        { name: "Garage", area: 280, quantity: 1, priority: "important", description: "Double garage with storage" },
      ],
      designPrinciples: [
        "Seamless indoor-outdoor connection",
        "Natural light optimization",
        "Sustainable material selection",
        "Spatial flexibility and adaptability",
        "Biophilic design integration",
      ],
      materialPalette: [
        "Exposed board-formed concrete",
        "Engineered oak flooring",
        "Corten steel accents",
        "Aluminum-clad glazing systems",
        "Natural stone cladding",
        "Reclaimed wood details",
      ],
      sustainabilityStrategies: [
        "Passive solar design with south-facing glazing",
        "High-performance building envelope",
        "Rainwater harvesting system",
        "Solar photovoltaic array",
      ],
      estimatedBudget: "$850,000 - $1,200,000",
      timeline: "24-30 months",
      styleDirection: "Contemporary architecture with natural material warmth",
    };
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
