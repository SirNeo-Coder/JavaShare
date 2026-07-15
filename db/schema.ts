import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const classrooms = sqliteTable("classrooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  teacherEmail: text("teacher_email").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  classroomId: text("classroom_id").notNull(),
  name: text("name").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull(),
  filename: text("filename").notNull().default("Main.java"),
  code: text("code").notNull(),
  version: integer("version").notNull().default(1),
  updatedAt: integer("updated_at").notNull(),
  updatedBy: text("updated_by").notNull(),
}, (table) => [uniqueIndex("workspaces_team_id_unique").on(table.teamId)]);

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull(),
  code: text("code").notNull(),
  submittedBy: text("submitted_by").notNull(),
  submittedAt: integer("submitted_at").notNull(),
  feedback: text("feedback"),
});

