import { accessibleProjectsForOperation } from '../../privilegeUtils';
import status from 'http-status';

export const handleGet = ({ models }) => {
	return async (ctx, next) => {
		const projectId = ctx.params.projectId;
		const prjs = accessibleProjectsForOperation(ctx, ctx.user, 'read');
		if (prjs[projectId] !== true) {
			ctx.throw(
				status.UNAUTHORIZED,
				'You do not have read access to this project.'
			);
		}
		ctx.body = await models.project.findByIdOrFail(projectId);
	};
};