import * as React from 'react';

const ImageSourceInformation = props => {
  const { metadata } = props;
  return (
    <React.Fragment>
      <div className="d-flex justify-content-between align-items-baseline">
        <h2>ImageSource Information</h2>
      </div>
      <table className="table table-sm table-bordered">
        <tbody>
          <tr>
            <th>Voxel count</th>
            <td>
              <div className="d-flex align-items-baseline">
                <span>{metadata.voxelCount[0]}</span>
                <small className="mx-1">x</small>
                <span>{metadata.voxelCount[1]}</span>
                <small className="mx-1">x</small>
                <span>{metadata.voxelCount[2]}</span>
              </div>
            </td>
          </tr>
          <tr>
            <th>Voxel size</th>
            <td>
              <div className="d-flex align-items-baseline">
                <span>{metadata.voxelSize[0]}</span>
                <small className="mx-1">x</small>
                <span>{metadata.voxelSize[1]}</span>
                <small className="mx-1">x</small>
                <span>{metadata.voxelSize[2]}</span>
              </div>
            </td>
          </tr>
          <tr>
            <th>Volume size [mm]</th>
            <td>
              <div className="d-flex align-items-baseline">
                <span>{metadata.voxelCount[0] * metadata.voxelSize[0]}</span>
                <small className="mx-1">x</small>
                <span>{metadata.voxelCount[1] * metadata.voxelSize[1]}</span>
                <small className="mx-1">x</small>
                <span>{metadata.voxelCount[2] * metadata.voxelSize[2]}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </React.Fragment>
  );
};

export default ImageSourceInformation;
