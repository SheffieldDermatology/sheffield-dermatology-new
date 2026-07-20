"use server";

/**
 * Task server actions. Each verifies the caller holds the relevant permission
 * server-side (never relying on hidden UI) and records task events + audit.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { tasks, taskEvents, taskComments, notifications } from "@/lib/db/schema";
import { requirePermission, auditAction } from "@/lib/auth/guards";

export type TaskActionState = { ok?: boolean; error?: string };

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  assigneeId: z.string().uuid().optional().or(z.literal("")),
  dueAt: z.string().optional().or(z.literal("")),
});

export async function createTask(_prev: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const user = await requirePermission("tasks.write");
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please provide a title and priority." };

  const db = getDb();
  const dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null;
  const [task] = await db
    .insert(tasks)
    .values({
      title: parsed.data.title,
      description: parsed.data.description || "",
      priority: parsed.data.priority,
      assigneeId: parsed.data.assigneeId || null,
      dueAt,
      createdBy: user.id,
      status: "open",
    })
    .returning({ id: tasks.id });

  await db.insert(taskEvents).values({ taskId: task!.id, actorId: user.id, kind: "created" });
  if (parsed.data.assigneeId) {
    await db.insert(notifications).values({
      userId: parsed.data.assigneeId,
      kind: "task_assigned",
      title: "A task was assigned to you",
      body: parsed.data.title,
      linkPath: "/staff/tasks",
    });
  }
  await auditAction(user, "task.created", "task", task!.id);
  revalidatePath("/staff/tasks");
  return { ok: true };
}

const statusSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["open", "in_progress", "blocked", "done", "cancelled"]),
});

export async function updateTaskStatus(
  _prev: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const user = await requirePermission("tasks.write");
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid task update." };

  const db = getDb();
  const rows = await db.select().from(tasks).where(eq(tasks.id, parsed.data.taskId)).limit(1);
  const task = rows[0];
  if (!task) return { error: "Task not found." };

  await db
    .update(tasks)
    .set({
      status: parsed.data.status,
      completedAt: parsed.data.status === "done" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, task.id));
  await db.insert(taskEvents).values({
    taskId: task.id,
    actorId: user.id,
    kind: "status_changed",
    fromValue: task.status,
    toValue: parsed.data.status,
  });
  await auditAction(user, "task.status_changed", "task", task.id, {
    from: task.status,
    to: parsed.data.status,
  });
  revalidatePath("/staff/tasks");
  return { ok: true };
}

const assignSchema = z.object({
  taskId: z.string().uuid(),
  assigneeId: z.string().uuid().optional().or(z.literal("")),
});

export async function assignTask(_prev: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const user = await requirePermission("tasks.assign");
  const parsed = assignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid assignment." };

  const db = getDb();
  const rows = await db.select().from(tasks).where(eq(tasks.id, parsed.data.taskId)).limit(1);
  const task = rows[0];
  if (!task) return { error: "Task not found." };

  const newAssignee = parsed.data.assigneeId || null;
  await db
    .update(tasks)
    .set({ assigneeId: newAssignee, updatedAt: new Date() })
    .where(eq(tasks.id, task.id));
  await db.insert(taskEvents).values({
    taskId: task.id,
    actorId: user.id,
    kind: "assigned",
    fromValue: task.assigneeId ?? "",
    toValue: newAssignee ?? "",
  });
  if (newAssignee) {
    await db.insert(notifications).values({
      userId: newAssignee,
      kind: "task_assigned",
      title: "A task was assigned to you",
      body: task.title,
      linkPath: "/staff/tasks",
    });
  }
  await auditAction(user, "task.assigned", "task", task.id);
  revalidatePath("/staff/tasks");
  return { ok: true };
}

const commentSchema = z.object({
  taskId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

export async function commentOnTask(
  _prev: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const user = await requirePermission("tasks.write");
  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please enter a comment." };

  const db = getDb();
  await db.insert(taskComments).values({
    taskId: parsed.data.taskId,
    authorId: user.id,
    body: parsed.data.body,
  });
  await auditAction(user, "task.commented", "task", parsed.data.taskId);
  revalidatePath(`/staff/tasks`);
  return { ok: true };
}
