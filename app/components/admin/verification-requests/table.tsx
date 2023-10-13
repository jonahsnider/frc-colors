import { VerificationRequestSchema } from '@/app/api/_lib/teams/verification-requests/dtos/verification-request.dto';
import TableRow from './table-row';

type Props = {
	requests: VerificationRequestSchema[];
};

export default function VerificationRequestsTable({ requests }: Props) {
	return (
		<div>
			<div className='flex flex-col gap-y-1'>
				{requests.map((verificationRequest) => (
					<TableRow key={verificationRequest.id} request={verificationRequest} />
				))}
			</div>
		</div>
	);
}