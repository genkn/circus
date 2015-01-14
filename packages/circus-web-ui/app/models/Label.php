<?php


use Jenssegers\Mongodb\Model as Eloquent;

/**
 * Label table manipulation class
 */
class Label extends Eloquent {
	protected $connection = 'mongodb';
	protected $collection = 'Labels';

	protected $primaryKey = 'labelID';

	/**
	 * Search conditions Building
	 * @param $query Query Object
	 * @param $input Input value
	 * @return Query Object
	 */
	public function scopeAddWhere($query, $input) {

		return $query;
	}

	/**
	 * Validate Rules
	 */
	private $rules = array(
		'labelID'	=>	'required|integer',
		'storageID'	=>	'required',
		'x'			=>	'required|integer',
		'y'			=>	'required|integer',
		'z'			=>	'required|integer',
		'w'			=>	'integer',
		'h'			=>	'integer',
		'd'			=>	'integer',
		'creator'	=>	'required',
		'date'		=>	'required'
	);

	/**
	 * Validate Check
	 * @param $data Validate checked
	 * @return Error content
	 */
	public function validate($data) {
		$validator = Validator::make($data, $this->rules);

		if ($validator->fails()) {
			return $validator->messages();
		}
		return;
	}
}
