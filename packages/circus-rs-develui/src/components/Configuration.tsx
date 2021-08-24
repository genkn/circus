import * as React from 'react';
import { useSelector } from 'react-redux';
import * as cnf from '../store/configuration';
import { dispatch, RootState } from '../store';

const Configuration: React.FC<{}> = () => {

  const config = useSelector((state: RootState) => state.configuration);

  const {
    server,
    labelHost,
    labelBasePath,
    maskDataPath,
    seriesEntries: seriesEntriesProp
  } = config;

  const [inputs, setInputs] = React.useState({
    server,
    labelHost,
    labelBasePath,
    maskDataPath,
  });

  const [seriesEntries, setSeriesEntries] = React.useState<(cnf.SeriesEntry & { id: string; })[]>(seriesEntriesProp.map(entry => ({
    ...entry,
    id: generateId()
  })));

  // React.useEffect(() => {
  //   const state = store.getState();
  //   const {
  //     server,
  //     seriesUid,
  //     partialVolumeDescriptor,
  //     labelHost,
  //     labelBasePath,
  //     maskDataPath,
  //   } = state.configuration;

  //   setInputs({
  //     ...inputs,
  //     server,
  //     seriesUid,
  //     partialVolumeDescriptor,
  //     labelHost,
  //     labelBasePath,
  //     maskDataPath,
  //   });

  //   setSeriesEntries(seriesEntriesSelector(state).map(entry => ({
  //     ...entry,
  //     id: generateId()
  //   })));
  // }, []);

  const onClickApplyButton = () => {
    dispatch(cnf.setServer(inputs.server));
    dispatch(cnf.setSeriesEntries(seriesEntries));
    dispatch(cnf.saveConfiguration());
  };

  const handleRemoveEntry = (id: string) =>
    setSeriesEntries(seriesEntries.filter(entry => entry.id !== id));

  const handleInput = (item: string) => (ev) => setInputs({
    ...inputs,
    [item]: ev.target.value
  });
  const handleEntryInput = (id: string, item: keyof cnf.SeriesEntry) => (ev, value?) => {
    const index = seriesEntries.findIndex(entry => entry.id === id);
    if (-1 < index) {
      setSeriesEntries([
        ...seriesEntries.slice(0, index),
        {
          ...seriesEntries[index],
          [item]: value ?? ev.target.value
        },
        ...seriesEntries.slice(index + 1),
      ]);
    }
  };

  const handleSelectEntry = (id: string, selected: boolean) => {
    setSeriesEntries(
      seriesEntries.map(entry => ({
        ...entry,
        selected: selected && entry.id === id
      }))
    );
  }

  const onClickAddSeriesEntryButton = () => {
    setSeriesEntries([...seriesEntries, {
      id: generateId(),
      selected: false,
      title: "",
      seriesUid: "",
      partialVolumeDescriptor: "",
      useLabelDataUrl: "0",
      useMaskDataUrl: "0",
    }])
  };

  return (
    <div className="container mb-5">
      <h1 className="display-3">Configuration</h1>
      <hr />
      <div className="row">
        <div className="col-sm-4">
          <div className="form-group">
            <label>rs server</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={inputs.server}
              onChange={handleInput('server')}
            />
          </div>
          <hr />
          <div className="form-group">
            <label>label server</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={inputs.labelHost}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>label data url</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={inputs.labelBasePath + "candidates.json"}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>mask data url</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={inputs.maskDataPath}
              readOnly
            />
          </div>
        </div>
        <div className="col-sm-8">
          <strong>Series</strong>
          <div className="list-group">
            {seriesEntries.map((seriesEntry) => (
              <SeriesListItem key={seriesEntry.id} {...seriesEntry}
                handleRemoveEntry={handleRemoveEntry}
                handleEntryInput={handleEntryInput}
                handleSelectEntry={handleSelectEntry}
              />
            ))}
            <button className="p-1 text-center list-group-item list-group-item-action" onClick={onClickAddSeriesEntryButton}>Add</button>
          </div>
        </div>
      </div>
      <hr />
      <div className="d-flex justify-content-center">
        <button className="btn btn-primary" onClick={onClickApplyButton}>Apply</button>
      </div>
    </div>
  );
}

const SeriesListItem: React.FC<any> = props => {
  const { id, selected, title, seriesUid, partialVolumeDescriptor, useLabelDataUrl, useMaskDataUrl } = props;
  const { handleSelectEntry, handleEntryInput, handleRemoveEntry } = props;

  // const [inputs, setInputs] = React.useState<SeriesEntry>({
  //   selected,
  //   title,
  //   seriesUid,
  //   partialVolumeDescriptor
  // });

  // const _handleEntryInput = (id: string, item: string) => (ev) => setInputs({
  //   ...inputs,
  //   [item]: ev.target.value
  // });

  const handleTitleInput = handleEntryInput(id, 'title');
  const handleSeriesUidInput = handleEntryInput(id, 'seriesUid');
  const handlePartialVolumeDescriptorInput = handleEntryInput(id, 'partialVolumeDescriptor');
  const handleToggleUseLabel = handleEntryInput(id, 'useLabelDataUrl');
  const handleToggleUseMask = handleEntryInput(id, 'useMaskDataUrl');

  return (
    <div className="list-group-item">
      <div className="form-row align-items-center">
        <div className="col-1">
          <div className="custom-control custom-checkbox">
            <input type="checkbox" className="custom-control-input" id={'entry-' + id}
              checked={selected}
              onChange={(ev) => handleSelectEntry(id, ev.target.checked)}
            />
            <label className="custom-control-label" htmlFor={'entry-' + id}></label>
          </div>
        </div>
        <div className="col-11">
          <div className="form-row">
            <div className="col-11">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="(title)"
                value={title}
                onChange={handleTitleInput}
              />
            </div>
            <div className="col-1">
              <button className="btn btn-sm btn-outline-danger btn-block border-0"
                onClick={() => handleRemoveEntry(id)}>-</button>
            </div>
          </div>
          <div className="form-row mt-1">
            <div className="col-8">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="(seriesUid)"
                value={seriesUid}
                onChange={handleSeriesUidInput}
              />
            </div>
            <div className="col-4">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="(partialVolumeDescriptor)"
                value={partialVolumeDescriptor}
                onChange={handlePartialVolumeDescriptorInput}
              />
            </div>
          </div>
          <div className="form-row mt-1">
            <div className="col-6">
              <div className="custom-control custom-checkbox">
                <input type="checkbox" className="custom-control-input" id={'entry-vr-label-' + id}
                  checked={useLabelDataUrl === '1'}
                  onChange={(ev) => handleToggleUseLabel(ev, ev.target.checked ? '1' : '0')}
                />
                <label className="custom-control-label" htmlFor={'entry-vr-label-' + id}>Use label data url</label>
              </div>
            </div>
            <div className="col-6">
              <div className="custom-control custom-checkbox">
                <input type="checkbox" className="custom-control-input" id={'entry-vr-mask-' + id}
                  checked={useMaskDataUrl === '1'}
                  onChange={(ev) => handleToggleUseMask(ev, ev.target.checked ? '1' : '0')}
                />
                <label className="custom-control-label" htmlFor={'entry-vr-mask-' + id}>Use mask data url</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const generateId = () => (new Date().getTime().toString() + Math.random().toString()).replace(/\D+/g, '');

export default Configuration;
