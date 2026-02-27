import path from "node:path";
import type { OpenClawConfig } from "../config/config.js";
import { resolveAgentConfig } from "./agent-scope.js";

export type ToolFsPolicy = {
  workspaceOnly: boolean;
  protectedPaths: string[];
};

export function createToolFsPolicy(params: {
  workspaceOnly?: boolean;
  protectedPaths?: string[];
}): ToolFsPolicy {
  return {
    workspaceOnly: params.workspaceOnly === true,
    protectedPaths: params.protectedPaths ?? [],
  };
}

export function resolveToolFsConfig(params: { cfg?: OpenClawConfig; agentId?: string }): {
  workspaceOnly?: boolean;
  protectedPaths?: string[];
} {
  const cfg = params.cfg;
  const globalFs = cfg?.tools?.fs;
  const agentFs =
    cfg && params.agentId ? resolveAgentConfig(cfg, params.agentId)?.tools?.fs : undefined;
  // protectedPaths: merge global + agent-level (agent can add more but not remove global protections)
  const globalProtected = globalFs?.protectedPaths ?? [];
  const agentProtected = agentFs?.protectedPaths ?? [];
  const mergedProtected = [...new Set([...globalProtected, ...agentProtected])];
  return {
    workspaceOnly: agentFs?.workspaceOnly ?? globalFs?.workspaceOnly,
    protectedPaths: mergedProtected.length > 0 ? mergedProtected : undefined,
  };
}

export function resolveEffectiveToolFsWorkspaceOnly(params: {
  cfg?: OpenClawConfig;
  agentId?: string;
}): boolean {
  return resolveToolFsConfig(params).workspaceOnly === true;
}

/**
 * Check if a file path is protected by the configured protectedPaths.
 * @param relativePath - Path relative to workspace root (e.g. "AGENTS.md", "knowledge/company/sop.md")
 * @param protectedPaths - List of protected path patterns from config
 * @returns true if the path is protected and should not be written/edited/deleted
 */
export function isProtectedPath(relativePath: string, protectedPaths: string[]): boolean {
  if (protectedPaths.length === 0) {
    return false;
  }
  const normalized = path.normalize(relativePath).replace(/\\/g, "/");
  for (const pattern of protectedPaths) {
    const normalizedPattern = path.normalize(pattern).replace(/\\/g, "/");
    if (normalizedPattern.endsWith("/")) {
      // Directory prefix: protect everything under it
      if (normalized.startsWith(normalizedPattern) || normalized + "/" === normalizedPattern) {
        return true;
      }
    } else {
      // Exact file match
      if (normalized === normalizedPattern) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Assert that a path is not protected. Throws if it is.
 */
export function assertNotProtectedPath(relativePath: string, protectedPaths: string[]): void {
  if (isProtectedPath(relativePath, protectedPaths)) {
    throw new Error(
      `Write denied: "${relativePath}" is a protected file. Protected paths cannot be modified by the agent.`,
    );
  }
}
