import type { PageDefinition } from "@/modules/page-builder/blocks";
import type { PageRepository } from "@/application/ports/page-repository";
import { demoHomePage } from "@/infrastructure/demo/demo-home-page";

const PAGES: Record<string, PageDefinition> = {
  inicio: demoHomePage,
};

export class DemoPageRepository implements PageRepository {
  async getPublishedPage(slug: string): Promise<PageDefinition | null> {
    return PAGES[slug] ?? null;
  }

  async getHomePage(): Promise<PageDefinition | null> {
    return demoHomePage;
  }
}
