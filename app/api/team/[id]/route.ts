import { NextRequest, NextResponse } from 'next/server';
import { TeamSchema } from '../../_lib/teams/dtos/team.dto';
import { teamsService } from '../../_lib/teams/teams.service';
import { validateParams } from '../../_lib/util/validate-request';
import { z } from 'zod';
import { TeamNumberSchema, TeamNumberStringSchema } from '../../_lib/teams/dtos/team-number.dto';
import { ExceptionSchema } from '../../_lib/exceptions/dtos/exception.dto';
import { BaseHttpException } from '../../_lib/exceptions/base.exception';

export async function GET(
	request: NextRequest,
	context: { params: { id: string } },
): Promise<NextResponse<TeamSchema | ExceptionSchema>> {
	const params = validateParams(context, z.object({ id: TeamNumberStringSchema }));

	if (params instanceof NextResponse) {
		return params;
	}

	const teamNumber = TeamNumberSchema.parse(params.id);

	const colors = await teamsService.getTeamColors(teamNumber);

	if (colors instanceof BaseHttpException) {
		return colors.toResponse();
	}

	return NextResponse.json({
		teamNumber: teamNumber,
		colors: {
			primaryHex: colors.primary,
			secondaryHex: colors.secondary,
			verified: colors.verified,
		},
	});
}
