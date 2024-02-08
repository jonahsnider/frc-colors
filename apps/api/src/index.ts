import * as Sentry from '@sentry/bun';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { inspectRoutes } from 'hono/dev';
import { logger as honoLogger } from 'hono/logger';
import { controllers } from './api/controllers/index';
import { errorHandler } from './api/error-handler';
import { cacheManager } from './cache-manager/cache-manager.service';
import { configService } from './config/config.service';
import { baseLogger } from './logger/logger';

Sentry.init({
	dsn: configService.sentryDsn,
	tracesSampleRate: 1.0,
	environment: configService.nodeEnv,
});

const logger = baseLogger.child({ module: 'server' });

const app = new Hono()
	.onError(errorHandler)
	.use(
		'*',
		honoLogger((...messages) => logger.info(...messages)),
	)
	.use('/v1/*', cors())
	.use(
		'/internal/*',
		cors({
			origin: configService.websiteUrl,
		}),
	)
	.use(
		'/trpc/*',
		cors({
			origin: configService.websiteUrl,
		}),
	)
	.route('/', controllers);

// biome-ignore lint/correctness/noUndeclaredVariables: This is a global
const server = Bun.serve({
	fetch: app.fetch,
	port: configService.port,
	development: configService.nodeEnv === 'development',
});

logger.info(`Listening at ${server.url.toString()}`);

if (configService.nodeEnv === 'development') {
	logger.debug('Routes:');
	for (const route of inspectRoutes(app)) {
		if (!route.isMiddleware) {
			logger.debug(`${route.method} ${route.path}`);
		}
	}
}

cacheManager.init();

// Initial refresh on boot, but only if not in development (hot reload reruns this too often)
if (configService.nodeEnv !== 'development') {
	await cacheManager.refresh();
}

export { type AppRouter } from './trpc/app.router';
