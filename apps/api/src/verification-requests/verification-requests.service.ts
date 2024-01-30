import { Comparable, Sort } from '@jonahsnider/util';
import assert from 'assert/strict';
import { ms } from 'convert';
import { and, eq, gt, ne, or } from 'drizzle-orm';
import { db } from '../db/db';
import { Schema } from '../db/index';
import { TeamNumber } from '../teams/dtos/team-number.dto';
import { VerificationRequest } from './dtos/verification-request.dto';

export class VerificationRequestsService {
	private static dbVerificationRequestToDto(
		row: typeof Schema.colorVerificationRequests.$inferSelect,
	): VerificationRequest {
		return {
			id: row.id,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt ?? undefined,
			team: row.teamId,
			status: row.status,
		};
	}

	private static orderVerificationRequestStatus(status: Schema.VerificationRequestStatus): Comparable {
		switch (status) {
			case Schema.VerificationRequestStatus.Pending:
				return 0;
			case Schema.VerificationRequestStatus.Finished:
			case Schema.VerificationRequestStatus.Rejected:
				return 1;
		}
	}

	async requestVerification(teamNumber: TeamNumber): Promise<VerificationRequest> {
		let insertedRow: typeof Schema.colorVerificationRequests.$inferSelect | undefined;

		await db.transaction(async (tx) => {
			await tx.insert(Schema.teams).values({ id: teamNumber }).onConflictDoNothing();

			[insertedRow] = await db
				.insert(Schema.colorVerificationRequests)
				.values({ teamId: teamNumber, status: Schema.VerificationRequestStatus.Pending })
				.returning();
		});

		assert(insertedRow);

		return VerificationRequestsService.dbVerificationRequestToDto(insertedRow);
	}

	async updateVerificationStatus(
		id: number,
		status: Schema.VerificationRequestStatus,
	): Promise<VerificationRequest | undefined> {
		const updated = await db
			.update(Schema.colorVerificationRequests)
			.set({ status, updatedAt: new Date() })
			.where(eq(Schema.colorVerificationRequests.id, id))
			.returning();

		const verificationRequest = updated[0];

		if (!verificationRequest) {
			return undefined;
		}

		return VerificationRequestsService.dbVerificationRequestToDto(verificationRequest);
	}

	async updatePendingVerificationStatusesByTeam(
		teamNumber: TeamNumber,
		status: Schema.VerificationRequestStatus,
	): Promise<VerificationRequest[]> {
		const updated = await db
			.update(Schema.colorVerificationRequests)
			.set({ status, updatedAt: new Date() })
			.where(
				and(
					eq(Schema.colorVerificationRequests.teamId, teamNumber),
					eq(Schema.colorVerificationRequests.status, Schema.VerificationRequestStatus.Pending),
				),
			)
			.returning();

		return updated.map(VerificationRequestsService.dbVerificationRequestToDto);
	}

	async findManyVerificationRequests(team?: TeamNumber): Promise<VerificationRequest[]> {
		const condition = team
			? eq(Schema.colorVerificationRequests.teamId, team)
			: or(
					eq(Schema.colorVerificationRequests.status, Schema.VerificationRequestStatus.Pending),
					and(
						ne(Schema.colorVerificationRequests.status, Schema.VerificationRequestStatus.Pending),
						gt(Schema.colorVerificationRequests.updatedAt, new Date(Date.now() - ms('7d'))),
					),
			  );

		const verificationRequests = await db.select().from(Schema.colorVerificationRequests).where(condition);

		if (team) {
			verificationRequests.sort(Sort.descending((request) => request.createdAt));
		} else {
			verificationRequests.sort(
				Sort.combine(
					Sort.ascending((request) => VerificationRequestsService.orderVerificationRequestStatus(request.status)),
					Sort.descending((request) => request.createdAt),
				),
			);
		}

		return verificationRequests.map(VerificationRequestsService.dbVerificationRequestToDto);
	}
}

export const verificationRequestsService = new VerificationRequestsService();
