<?php

/**
 * Model class for series.
 * @property string studyUID
 * @property string seriesUID Series ID
 * @property number storageID ID indicating the storage location of the data
 * @property array patientInfo Patient information
 * @property number width Width of images
 * @property number height Height of images
 * @property string seriesDate Series creation date
 * @property string modality Creating type
 * @property string seriesDescription Description of series
 * @property string bodyPart Body site
 * @property string images Use image
 * @property string stationName Image creation device name
 * @property string modelName Image creation model name
 * @property string manufacturer Equipment manufacturers
 * @property array parameters Parameters
 * @property string receiveMethod Origin
 * @property string domain Domain
 */
class Series extends BaseModel {
	protected $connection = 'mongodb';

	const COLLECTION = 'Series';
	protected $collection = self::COLLECTION;

	protected $primaryKey = 'seriesUID';

	public function storage() {
		return $this->belongsTo('Storage', 'storageID', 'storageID');
	}

	/**
	 * Deletes this series from DB, and also delete all associated DICOM files.
	 * @return bool|null
	 * @throws Exception
	 */
	public function deleteAssociatedImageFiles() {
		$path = $this->storage->dicomStoragePath($this->seriesUID);
		foreach (new DirectoryIterator($path) as $file) {
			if ($file->isFile()) {
				if (!unlink($file->getRealPath())) {
					return false;
				}
			}
		}
		if (!rmdir($path)) {
			return false;
		}
		return true;
	}

	/**
	 * Validation rules
	 */
	protected $rules = array(
		'studyUID'				  => 'required|strict_string',
		'seriesUID'				  => 'required|strict_string',
		'storageID'				  => 'required|strict_integer',
		'patientInfo'			  => 'strict_array',
		'patientInfo.patientID'	  => 'strict_string',
		'patientInfo.patientName' => 'strict_string',
		'patientInfo.age'		  => 'strict_integer',
		'patientInfo.birthDate'	  => 'strict_date',
		'patientInfo.sex'		  => 'in:F,M,O',
		'patientInfo.size'		  => 'strict_float',
		'patientInfo.weight'	  => 'strict_float',
		'width'					  => 'required|strict_integer',
		'height'				  => 'required|strict_integer',
		'seriesDate'			  => 'required|mongodate',
		'modality'				  => 'strict_string',
		'seriesDescription'		  => 'strict_string',
		'bodyPart'				  => 'strict_string',
		'images'				  => 'required|strict_string',
		'stationName'			  => 'strict_string',
		'modelName'				  => 'strict_string',
		'manufacturer'			  => 'strict_string',
		'parameters'			  => 'strict_array',
		'receiveMethod'			  => 'strict_string',
		'domain'				  => 'required|strict_string',
		'createTime'			  => 'mongodate',
		'updateTime'			  => 'mongodate'
	);

	/**
	 * シリーズイメージ範囲を取得する
	 * @param String $id シリーズID
	 * @return シリーズのイメージ範囲
	 */
	public static function getImages($id) {
		$series = Series::find($id);
		return $series ? $series->images : '';
	}

	/**
	 * シリーズ説明を取得する
	 * @param Stirng $id シリーズID
	 * @return シリーズ説明
	 */
	public static function getSeriesDescription($id){
		$series = self::find($id);
		return $series ? $series->seriesDescription : '';
	}

	/**
	 * シリーズの一覧を取得する
	 * @param Array $ids シリーズID群
	 * @return シリーズリスト
	 */
	public static function getPluralSeries($ids) {
		return self::whereIn('seriesUID', $ids)
				   ->get();
	}

	/**
	 * シリーズ一覧取得
	 * @param Array $search_data 検索条件
	 * @return シリーズ一覧
	 */
	public static function getSeriesList($search_data) {
		return self::where(function($query) use ($search_data) {
							//seriesID Series ID
							if ($search_data['seriesUID'])
								$query->where('seriesUID', 'like', '%'.$search_data['seriesUID'].'%');

							if ($search_data['seriesDescription'])
								$query->where('seriesDescription', 'like', '%'.$search_data['seriesDescription'].'%');

							if ($search_data['patientID'])
								$query->where('patientInfo.patientID', 'like', '%'.$search_data['patientID'].'%');

							if ($search_data['patientName'])
								$query->where('patientInfo.patientName', 'like', '%'.$search_data['patientName'].'%');

							if ($search_data['minAge'])
								$query->where('patientInfo.age', '>=', intval($search_data['minAge']));

							if ($search_data['maxAge'])
								$query->where('patientInfo.age', '<=', intval($search_data['maxAge']));

							if ($search_data['sex'] && $search_data['sex'] !== 'all')
								$query->where('patientInfo.sex', '=', $input['sex']);
					})
					->get();
	}
}