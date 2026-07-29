"use server";

import { and, asc, desc, eq, gt, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs, pageSections, pageVersions, pages } from "@/infrastructure/db/schema";
import { actionError, type AdminActionState } from "@/modules/admin/action-state";
import { requirePermission } from "@/modules/auth/session";
import { blockTypes, defaultBlockConfig, parseBlockConfig, type BlockType } from "@/modules/page-builder/editor";

const slugSchema = z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug solo admite minúsculas, números y guiones.");

function editorPath(pageId?: string) {
  revalidatePath("/admin/editor");
  if (pageId) revalidatePath(`/admin/editor/${pageId}`);
  revalidatePath("/", "layout");
}

async function pageAndLatest(pageId: string) {
  const db = await getRuntimeDb();
  const [page] = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
  if (!page) throw new Error("La página ya no existe.");
  const [latest] = await db.select().from(pageVersions).where(eq(pageVersions.pageId, pageId)).orderBy(desc(pageVersions.versionNumber)).limit(1);
  return { db, page, latest };
}

async function editableVersion(pageId: string, userId: string) {
  const { db, page, latest } = await pageAndLatest(pageId);
  if (!latest) {
    const [created] = await db.insert(pageVersions).values({ pageId, versionNumber: 1, createdByUserId: userId }).returning();
    return { db, page, version: created };
  }
  if (latest.id !== page.publishedVersionId) return { db, page, version: latest };
  const [created] = await db.insert(pageVersions).values({ pageId, versionNumber: latest.versionNumber + 1, createdByUserId: userId }).returning();
  const sections = await db.select().from(pageSections).where(eq(pageSections.pageVersionId, latest.id)).orderBy(asc(pageSections.order));
  if (sections.length) {
    await db.insert(pageSections).values(sections.map((section) => ({
      pageVersionId: created.id,
      blockType: section.blockType,
      order: section.order,
      config: section.config,
      visibleOnMobile: section.visibleOnMobile,
      visibleOnDesktop: section.visibleOnDesktop,
    })));
  }
  return { db, page, version: created };
}

async function audit(userId: string, action: string, pageId: string, before?: Record<string, unknown>, after?: Record<string, unknown>) {
  const db = await getRuntimeDb();
  await db.insert(auditLogs).values({ userId, action, entityType: "page", entityId: pageId, before, after });
}

export async function createPageAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("content", "create");
    const title = z.string().trim().min(2).max(120).parse(formData.get("title"));
    const slug = slugSchema.parse(formData.get("slug"));
    const db = await getRuntimeDb();
    const [created] = await db.insert(pages).values({ title, slug, status: "draft" }).returning();
    await db.insert(pageVersions).values({ pageId: created.id, versionNumber: 1, createdByUserId: session.user.id });
    await audit(session.user.id, "page.create", created.id, undefined, { title, slug, status: "draft" });
    editorPath(created.id);
    return { status: "success", message: `Página “${title}” creada. Ábrela en la lista para agregar bloques.` };
  } catch (error) {
    return actionError(error);
  }
}

export async function updatePageAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("content", "update");
    const pageId = z.string().min(1).parse(formData.get("pageId"));
    const title = z.string().trim().min(2).max(120).parse(formData.get("title"));
    const slug = slugSchema.parse(formData.get("slug"));
    const seoTitle = z.string().trim().max(120).parse(formData.get("seoTitle") ?? "") || null;
    const seoDescription = z.string().trim().max(240).parse(formData.get("seoDescription") ?? "") || null;
    const isHome = formData.get("isHome") === "on";
    const { db, page } = await pageAndLatest(pageId);
    if (isHome) await db.update(pages).set({ isHome: false, updatedAt: new Date() }).where(and(eq(pages.isHome, true), ne(pages.id, pageId)));
    const after = { title, slug, seoTitle, seoDescription, isHome, updatedAt: new Date() };
    await db.update(pages).set(after).where(eq(pages.id, pageId));
    await audit(session.user.id, "page.update", pageId, page as unknown as Record<string, unknown>, after);
    editorPath(pageId);
    return { status: "success", message: "Información y SEO guardados." };
  } catch (error) {
    return actionError(error);
  }
}

export async function addBlockAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("content", "create");
    const pageId = z.string().min(1).parse(formData.get("pageId"));
    const blockType = z.enum(blockTypes).parse(formData.get("blockType")) as BlockType;
    const { db, version } = await editableVersion(pageId, session.user.id);
    const sections = await db.select().from(pageSections).where(eq(pageSections.pageVersionId, version.id));
    const [created] = await db.insert(pageSections).values({
      pageVersionId: version.id,
      blockType,
      order: sections.length,
      config: defaultBlockConfig(blockType),
    }).returning();
    await audit(session.user.id, "page.block.create", pageId, undefined, { blockId: created.id, blockType, version: version.versionNumber });
    editorPath(pageId);
    return { status: "success", message: "Bloque agregado al borrador." };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateBlockAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("content", "update");
    const pageId = z.string().min(1).parse(formData.get("pageId"));
    const sourceBlockId = z.string().min(1).parse(formData.get("blockId"));
    const { db, version } = await editableVersion(pageId, session.user.id);
    let blockId = sourceBlockId;
    let [block] = await db.select().from(pageSections).where(and(eq(pageSections.id, sourceBlockId), eq(pageSections.pageVersionId, version.id))).limit(1);
    if (!block) {
      const [source] = await db.select().from(pageSections).where(eq(pageSections.id, sourceBlockId)).limit(1);
      if (!source) throw new Error("El bloque ya no existe.");
      [block] = await db.select().from(pageSections).where(and(eq(pageSections.pageVersionId, version.id), eq(pageSections.order, source.order))).limit(1);
      if (!block) throw new Error("No fue posible localizar la copia editable del bloque.");
      blockId = block.id;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(z.string().min(2).parse(formData.get("configJson")));
    } catch {
      throw new Error("La configuración no contiene JSON válido. Revisa comas y comillas.");
    }
    const selectedImage = String(formData.get("selectedImage") ?? "").trim();
    if (block.blockType === "image_text" && selectedImage && parsed && typeof parsed === "object") {
      parsed = { ...(parsed as Record<string, unknown>), imageUrl: selectedImage };
    }
    const config = parseBlockConfig(block.blockType, parsed);
    const after = {
      config,
      visibleOnMobile: formData.get("visibleOnMobile") === "on",
      visibleOnDesktop: formData.get("visibleOnDesktop") === "on",
      updatedAt: new Date(),
    };
    await db.update(pageSections).set(after).where(eq(pageSections.id, blockId));
    await audit(session.user.id, "page.block.update", pageId, block as unknown as Record<string, unknown>, { blockId, ...after });
    editorPath(pageId);
    return { status: "success", message: "Bloque guardado en el borrador." };
  } catch (error) {
    return actionError(error);
  }
}

export async function blockOperationAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const operation = z.enum(["duplicate", "delete", "up", "down"]).parse(formData.get("operation"));
    const permission = operation === "delete" ? "delete" : operation === "duplicate" ? "create" : "update";
    const session = await requirePermission("content", permission);
    const pageId = z.string().min(1).parse(formData.get("pageId"));
    const sourceBlockId = z.string().min(1).parse(formData.get("blockId"));
    const { db, version } = await editableVersion(pageId, session.user.id);
    const ordered = await db.select().from(pageSections).where(eq(pageSections.pageVersionId, version.id)).orderBy(asc(pageSections.order));
    let index = ordered.findIndex((row) => row.id === sourceBlockId);
    if (index < 0) {
      const [source] = await db.select().from(pageSections).where(eq(pageSections.id, sourceBlockId)).limit(1);
      index = source ? ordered.findIndex((row) => row.order === source.order) : -1;
    }
    if (index < 0) throw new Error("El bloque ya no existe en el borrador.");
    const block = ordered[index];
    if (operation === "duplicate") {
      await db.update(pageSections).set({ order: block.order + 1 }).where(and(eq(pageSections.pageVersionId, version.id), gt(pageSections.order, block.order)));
      await db.insert(pageSections).values({ pageVersionId: version.id, blockType: block.blockType, order: block.order + 1, config: block.config, visibleOnMobile: block.visibleOnMobile, visibleOnDesktop: block.visibleOnDesktop });
    } else if (operation === "delete") {
      await db.delete(pageSections).where(eq(pageSections.id, block.id));
      for (const [order, row] of ordered.filter((row) => row.id !== block.id).entries()) {
        await db.update(pageSections).set({ order }).where(eq(pageSections.id, row.id));
      }
    } else {
      const targetIndex = operation === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= ordered.length) throw new Error("El bloque ya está en ese extremo.");
      const target = ordered[targetIndex];
      await db.update(pageSections).set({ order: target.order }).where(eq(pageSections.id, block.id));
      await db.update(pageSections).set({ order: block.order }).where(eq(pageSections.id, target.id));
    }
    await audit(session.user.id, `page.block.${operation}`, pageId, { blockId: block.id, order: block.order }, { version: version.versionNumber });
    editorPath(pageId);
    return { status: "success", message: operation === "delete" ? "Bloque eliminado del borrador." : operation === "duplicate" ? "Bloque duplicado." : "Orden actualizado." };
  } catch (error) {
    return actionError(error);
  }
}

export async function publishPageAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("content", "publish");
    const pageId = z.string().min(1).parse(formData.get("pageId"));
    const { db, page, latest } = await pageAndLatest(pageId);
    if (!latest) throw new Error("Agrega al menos una versión antes de publicar.");
    const sections = await db.select().from(pageSections).where(eq(pageSections.pageVersionId, latest.id)).orderBy(asc(pageSections.order));
    if (!sections.length) throw new Error("Agrega al menos un bloque antes de publicar.");
    sections.forEach((section) => parseBlockConfig(section.blockType, section.config));
    const now = new Date();
    await db.update(pageVersions).set({ publishedAt: now }).where(eq(pageVersions.id, latest.id));
    await db.update(pages).set({ status: "published", publishedVersionId: latest.id, updatedAt: now }).where(eq(pages.id, pageId));
    await audit(session.user.id, "page.publish", pageId, { publishedVersionId: page.publishedVersionId }, { publishedVersionId: latest.id, version: latest.versionNumber });
    editorPath(pageId);
    return { status: "success", message: `Versión ${latest.versionNumber} publicada.` };
  } catch (error) {
    return actionError(error);
  }
}

export async function restoreVersionAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("content", "update");
    const pageId = z.string().min(1).parse(formData.get("pageId"));
    const versionId = z.string().min(1).parse(formData.get("versionId"));
    const { db, latest } = await pageAndLatest(pageId);
    const [source] = await db.select().from(pageVersions).where(and(eq(pageVersions.id, versionId), eq(pageVersions.pageId, pageId))).limit(1);
    if (!source) throw new Error("La versión seleccionada ya no existe.");
    const [restored] = await db.insert(pageVersions).values({ pageId, versionNumber: (latest?.versionNumber ?? 0) + 1, createdByUserId: session.user.id }).returning();
    const sections = await db.select().from(pageSections).where(eq(pageSections.pageVersionId, source.id)).orderBy(asc(pageSections.order));
    if (sections.length) await db.insert(pageSections).values(sections.map((section) => ({ pageVersionId: restored.id, blockType: section.blockType, order: section.order, config: section.config, visibleOnMobile: section.visibleOnMobile, visibleOnDesktop: section.visibleOnDesktop })));
    await audit(session.user.id, "page.version.restore", pageId, { sourceVersion: source.versionNumber }, { draftVersion: restored.versionNumber });
    editorPath(pageId);
    return { status: "success", message: `Versión ${source.versionNumber} restaurada como borrador ${restored.versionNumber}.` };
  } catch (error) {
    return actionError(error);
  }
}
