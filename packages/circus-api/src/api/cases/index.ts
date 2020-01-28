import status from 'http-status';
import performSearch from '../performSearch';
import generateUniqueId from '../../utils/generateUniqueId';
import { EJSON } from 'bson';
import { fetchAccessibleSeries, UserPrivilegeInfo } from '../../privilegeUtils';
import { packAsMhd } from '../../case/packAsMhd';
import checkFilter from '../../utils/checkFilter';
import deepRenameKeys from 'deep-rename-keys';
import { RouteMiddleware, CircusContext } from '../../typings/middlewares';
import { Models } from '../../db/createModels';
import { SeriesEntry } from '../../typings/circus';

const maskPatientInfo = (ctx: CircusContext) => {
  return (caseData: any) => {
    const wantToView = ctx.user.preferences.personalInfoView;
    const accessibleProjects = ctx.userPrivileges.accessibleProjects;
    const project = accessibleProjects.find(
      p => caseData.projectId === p.projectId
    );
    if (!project) {
      throw new Error(
        `Project ${caseData.projectId} is not accessbible by ${ctx.user.userEmail}.`
      );
    }
    const viewable = project.roles.some(r => r === 'viewPersonalInfo');
    const view = viewable && wantToView;
    if (!view) {
      delete caseData.patientInfoCache;
    }
    return caseData;
  };
};

export const handleGet: RouteMiddleware = () => {
  return async (ctx, next) => {
    const aCase = ctx.case;
    delete aCase.latestRevision; // Remove redundant data
    ctx.body = maskPatientInfo(ctx)(aCase);
  };
};

const makeNewCase = async (
  models: Models,
  user: any,
  userPrivileges: UserPrivilegeInfo,
  project: any,
  series: SeriesEntry[],
  tags: string[]
) => {
  const caseId = generateUniqueId();

  const domains: { [domain: string]: boolean } = {};

  // Check write access for the project.
  const ok = userPrivileges.accessibleProjects.some(
    p => p.roles.indexOf('write') >= 0 && p.projectId === project.projectId
  );
  if (!ok) {
    throw new Error('You do not have write privilege for this project.');
  }

  const seriesData = await fetchAccessibleSeries(
    models,
    userPrivileges,
    series
  );
  const anyPatientInfoEntry = seriesData.find(i => !!i.patientInfo);
  seriesData.forEach(i => (domains[i.domain] = true));

  const revision = {
    creator: user.userEmail,
    date: new Date(),
    description: 'Created new case.',
    attributes: {},
    status: 'draft',
    series: seriesData.map(s => ({
      seriesUid: s.seriesUid,
      partialVolumeDescriptor: s.partialVolumeDescriptor,
      labels: []
    }))
  };

  await models.clinicalCase.insert({
    caseId,
    projectId: project.projectId,
    patientInfoCache: anyPatientInfoEntry
      ? anyPatientInfoEntry.patientInfo
      : null,
    tags,
    latestRevision: revision,
    revisions: [revision],
    domains: Object.keys(domains)
  });
  return caseId;
};

export const handlePost: RouteMiddleware = ({ models }) => {
  return async (ctx, next) => {
    const project = await models.project.findByIdOrFail(
      ctx.request.body.projectId
    );
    const caseId = await makeNewCase(
      models,
      ctx.user,
      ctx.userPrivileges,
      project,
      ctx.request.body.series,
      ctx.request.body.tags
    );
    ctx.body = { caseId };
  };
};

export const handlePostRevision: RouteMiddleware = ({ models }) => {
  return async (ctx, next) => {
    const aCase = ctx.case;
    const rev = ctx.request.body;

    if (rev.date) {
      ctx.throw(status.BAD_REQUEST, 'You cannot specify revision date.');
    }
    if (rev.creator) {
      ctx.throw(status.BAD_REQUEST, 'You cannot specify revision creator.');
    }

    rev.date = new Date();
    rev.creator = ctx.user.userEmail;

    await models.clinicalCase.modifyOne(aCase.caseId, {
      latestRevision: rev,
      revisions: [...aCase.revisions, rev]
    });
    ctx.body = null; // No Content
  };
};

export const handleSearch: RouteMiddleware = ({ models }) => {
  return async (ctx, next) => {
    const urlQuery = ctx.request.query;
    let customFilter: object;
    try {
      customFilter = urlQuery.filter ? EJSON.parse(urlQuery.filter) : {};
    } catch (err) {
      ctx.throw(status.BAD_REQUEST, 'Bad filter.');
    }
    const fields = [
      'projectId',
      'caseId',
      'patientInfo.patientId',
      'patientInfo.patientName',
      'patientInfo.age',
      'patientInfo.sex',
      'tags',
      'createdAt',
      'updatedAt'
    ];
    if (!checkFilter(customFilter!, fields))
      ctx.throw(status.BAD_REQUEST, 'Bad filter.');
    customFilter = deepRenameKeys(customFilter!, (k: string) =>
      k.replace(/^patientInfo/, 'patientInfoCache')
    );

    // const domainFilter = {};
    const accessibleProjectIds = ctx.userPrivileges.accessibleProjects.map(
      p => p.projectId
    );
    const accessibleProjectFilter = {
      projectId: { $in: accessibleProjectIds }
    };
    const filter = {
      $and: [customFilter, accessibleProjectFilter /* domainFilter */]
    };

    const mask = maskPatientInfo(ctx);
    const transform = (caseData: any) => {
      delete caseData.revisions;
      return mask(caseData);
    };

    await performSearch(models.clinicalCase, filter, ctx, {
      transform,
      defaultSort: { createdAt: -1 }
    });
  };
};

export const handleExportAsMhd: RouteMiddleware = deps => {
  return async (ctx, next) => {
    const caseId = ctx.case.caseId;
    ctx.type = 'application/zip';
    ctx.body = await packAsMhd(deps, caseId);
  };
};