import { router } from "../trpc";
import { targetingRouter } from "./targeting";
import { prospectingRouter } from "./prospecting";
import { researchRouter } from "./research";
import { composeRouter } from "./compose";
import { sequencesRouter } from "./sequences";
import { trackingRouter } from "./tracking";
import { settingsRouter } from "./settings";

export const appRouter = router({
  targeting: targetingRouter,
  prospecting: prospectingRouter,
  research: researchRouter,
  compose: composeRouter,
  sequences: sequencesRouter,
  tracking: trackingRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
