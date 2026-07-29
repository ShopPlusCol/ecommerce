import { asc, eq } from "drizzle-orm";
import type { PageRepository } from "@/application/ports/page-repository";
import type { Block, PageDefinition } from "@/modules/page-builder/blocks";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { pages, pageSections } from "@/infrastructure/db/schema";

export class DrizzlePageRepository implements PageRepository {
  async getPublishedPage(slug: string): Promise<PageDefinition | null> {
    const db = await getRuntimeDb();
    const [page] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
    if (!page || page.status !== "published" || !page.publishedVersionId) return null;
    const sections = await db
      .select()
      .from(pageSections)
      .where(eq(pageSections.pageVersionId, page.publishedVersionId))
      .orderBy(asc(pageSections.order));
    return {
      slug: page.slug,
      title: page.title,
      blocks: sections.map((section) => ({
        id: section.id,
        type: section.blockType,
        config: section.config,
        visibleOnMobile: section.visibleOnMobile,
        visibleOnDesktop: section.visibleOnDesktop,
      })) as Block[],
    };
  }
  async getHomePage() {
    const db = await getRuntimeDb();
    const [home] = await db.select({ slug: pages.slug }).from(pages).where(eq(pages.isHome, true)).limit(1);
    return home ? this.getPublishedPage(home.slug) : null;
  }
}
