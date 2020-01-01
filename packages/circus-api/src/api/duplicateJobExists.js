const duplicateJobExists = async (models, request) => {
  const { pluginId, series } = request;

  const filter = {
    $and: [{ status: { $ne: 'invalidated' } }, { status: { $ne: 'failed' } }],
    pluginId: pluginId,
    series: { $size: series.length }
  };

  for (let volId = 0; volId < series.length; volId++) {
    filter[`series.${volId}.seriesUid`] = series[volId].seriesUid;
    filter[`series.${volId}.partialVolumeDescriptor.start`] =
      series[volId].partialVolumeDescriptor.start;
    filter[`series.${volId}.partialVolumeDescriptor.end`] =
      series[volId].partialVolumeDescriptor.end;
    filter[`series.${volId}.partialVolumeDescriptor.delta`] =
      series[volId].partialVolumeDescriptor.delta;
  }

  const duplicateJobNumber = await models.pluginJob
    .findAsCursor(filter)
    .count();
  return duplicateJobNumber !== 0;
};

export default duplicateJobExists;
