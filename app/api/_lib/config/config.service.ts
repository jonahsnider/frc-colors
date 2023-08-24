import { z } from 'zod';

export class ConfigService {
	public readonly tbaApiKey: string | undefined;
	public readonly adminApiToken: string | undefined;

	constructor(source: Readonly<Record<string, unknown>>) {
		this.tbaApiKey = z.string().min(1).optional().parse(source.TBA_API_KEY);
		this.adminApiToken = z.string().min(1).optional().parse(source.ADMIN_PASSWORD);
	}
}

export const configService = new ConfigService(process.env);
