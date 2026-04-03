import { pgTable, text, serial, timestamp, real, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  projectType: text("project_type").notNull().default("residential"),
  status: text("status").notNull().default("draft"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  address: text("address"),
  siteArea: real("site_area"),
  siteAnalysis: jsonb("site_analysis"),
  questionnaire: jsonb("questionnaire"),
  program: jsonb("program"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;

export const projectImagesTable = pgTable("project_images", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  imageType: text("image_type").notNull(),
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProjectImageSchema = createInsertSchema(projectImagesTable).omit({ id: true, createdAt: true });
export type InsertProjectImage = z.infer<typeof insertProjectImageSchema>;
export type ProjectImage = typeof projectImagesTable.$inferSelect;
