import assert from 'assert/strict';
import { Server } from 'bun';
import { Context } from 'hono';
import { inspectRoutes } from 'hono/dev';
import { ManyTeamColors, TeamColors } from '../colors/dtos/colors.dto';
import { configService } from '../config/config.service';
import { baseLogger } from '../logger/logger';
import { TeamNumber } from '../teams/dtos/team-number.dto';
import { createAppController } from './controllers/app.controller';
import { Env } from './interfaces/env.interface';
import { ManyTeamColorsHttp, ManyTeamColorsHttpEntry, TeamColorsHttp } from './interfaces/http.interface';

export class ApiService {
	static getIp(context: Context<Env>): string {
		const ip = context.env.server.requestIP(context.req.raw)?.address;

		assert(ip, new TypeError('IP address was not available on request'));

		return ip;
	}

	static teamColorsToDto(colors: TeamColors): TeamColorsHttp {
		return {
			primaryHex: colors.primary,
			secondaryHex: colors.secondary,
			verified: colors.verified,
		};
	}

	static manyTeamColorsToDto(colors: ManyTeamColors): ManyTeamColorsHttp {
		const mapped: Record<TeamNumber, ManyTeamColorsHttpEntry> = {};

		for (const [team, teamColors] of colors) {
			const colors = teamColors ? ApiService.teamColorsToDto(teamColors) : null;
			mapped[team] = {
				colors,
				teamNumber: team,
			};
		}

		return {
			teams: mapped,
		};
	}

	private readonly logger = baseLogger.child({ module: 'server' });

	private initialized = false;

	initServer(): void {
		if (this.initialized) {
			throw new Error('Server already initialized');
		}

		this.initialized = true;

		let server: Server | undefined = undefined;

		// This is like, super unsafe, but also should never cause an issue
		// The reason for this silliness is that there is a circular dependency between Bun.serve requiring us to set a fetch function, and the fetch function requiring the server to be created
		const getServer = (): Server => server as Server;

		const appController = createAppController(getServer);

		// biome-ignore lint/correctness/noUndeclaredVariables: This is a global
		server = Bun.serve({
			fetch: appController.fetch,
			port: configService.port,
			development: configService.nodeEnv === 'development',
		});

		this.logger.info(`Listening at ${server.url.toString()}`);

		if (configService.nodeEnv === 'development') {
			this.logger.debug('Routes:');
			for (const route of inspectRoutes(appController)) {
				if (!route.isMiddleware) {
					this.logger.debug(`${route.method} ${route.path}`);
				}
			}
		}
	}
}

export const apiService = new ApiService();
