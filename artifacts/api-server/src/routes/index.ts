import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sectionsRouter from "./sections";
import entriesRouter from "./entries";
import portfolioRouter from "./portfolio";
import watchlistRouter from "./watchlist";
import searchRouter from "./search";
import dashboardRouter from "./dashboard";
import tagsRouter from "./tags";
import booksRouter from "./books";
import resourcesRouter from "./resources";
import roadmapRouter from "./roadmap";
import investorsRouter from "./investors";
import dataRouter from "./data";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sectionsRouter);
router.use(entriesRouter);
router.use(portfolioRouter);
router.use(watchlistRouter);
router.use(searchRouter);
router.use(dashboardRouter);
router.use(tagsRouter);
router.use(booksRouter);
router.use(resourcesRouter);
router.use(roadmapRouter);
router.use(investorsRouter);
router.use(dataRouter);

export default router;
