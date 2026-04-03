import { Router, type IRouter } from "express";
import healthRouter from "./health";
import animeProxyRouter from "./anime-proxy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(animeProxyRouter);

export default router;
