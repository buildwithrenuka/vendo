import {
  loadJalContext,
  type JalEnvConfig,
  type ShipFlowContext,
} from "@jal_ai/jal";
import type { JalProjectContext } from "@vendo/shared";

export function getJalContext(env: Env): ShipFlowContext {
  return loadJalContext(env as JalEnvConfig);
}

export function getJalContextForProject(context: JalProjectContext): ShipFlowContext {
  return {
    profile: context.profile,
    productName: context.productName,
    productContext: context.productContext,
    stackContext: context.stackContext,
    existingFeatures: context.existingFeatures,
    outOfScopeTerms: context.outOfScopeTerms,
    primaryUserLabels: context.primaryUserLabels,
    feedbackTabUrl: context.feedbackTabUrl,
  };
}

/** @deprecated use getJalContext */
export const getShipFlowContext = getJalContext;

export type { ShipFlowContext, JalEnvConfig, ShipFlowContext as JalContext };
