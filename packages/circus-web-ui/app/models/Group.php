<?php

/**
 * Group table operation
 */
class Group extends BaseModel
{
	protected $connection = 'mongodb';

	const COLLECTION = 'Groups';
	protected $collection = self::COLLECTION;

	protected $primaryKey = 'groupID';
	public $timestamps = false;

	/**
	 * Search conditions Building
	 * @param $query Query Object
	 * @param $input Input value
	 * @return Query Object
	 */
	public function scopeAddWhere($query, $input) {
		//groupID Group ID
		if (isset($input['groupID']) && $input['groupID']) {
			$groups = array();
			if (is_array($input['groupID'])) {
				Log::debug("===== GroupID Array =====");
				foreach ($input['groupID'] as $group){
					Log::debug("GroupID::".$group);
					$groups[] = intval($group);
				}
			} else {
				Log::debug("===== GroupID One =====");
				$groups[] = intval($input['groupID']);
			}
			Log::debug("===== SQL Bind Query =====");
			Log::debug($groups);
			//$query->whereIn('groupID', $input['groupID']);

			$query->whereIn('groupID', $groups);
		}

		//groupName Group Name
		if (isset($input['groupName']) && $input['groupName']) {
			//groupName of Groups table
			$query->where('groupName', 'like', '%'.$input['groupName'].'%');
		}

		return $query;
	}

	/**
	 * Limit / Offset setting
	 * @param $query Query Object
	 * @param $input Retrieval conditions
	 * @return $query Query Object
	 */
	public function scopeAddLimit($query, $input) {
		if (isset($input['perPage']) && $input['perPage']) {
			$query->skip(intval($input['disp'])*(intval($input['perPage'])-1));
		}
		$query->take($input['disp']);

		return $query;
	}

	const PROJECT_CREATE = 'createProject';
	const PROJECT_DELETE = 'deleteProject';
	const SERVER_MANAGE = 'manageServer';

	public static $privilegeList = [
		['privilege' => self::PROJECT_CREATE, 'caption' => 'Create Project'],
		['privilege' => self::PROJECT_DELETE, 'caption' => 'Delete Project'],
		['privilege' => self::SERVER_MANAGE, 'caption' => 'Manage Server']
	];

	/**
	 * Validate Rules
	 */
	protected $rules = [
		'groupID' => 'required|integer|min:0',
		'groupName' => 'required|alpha_dash',
		'privileges' => 'array_of_privileges'
	];
	protected $uniqueFields = ['groupName'];

	/**
	 * Validate Check
	 * @param $data Validate checked
	 * @return Error content
	 */
	public function validate($data) {
		$this->rules['groupName'] = isset($data['_id']) ?
										'required|unique:Groups,groupName,'.$data["_id"].',_id' :
										$this->rules['groupName'];
		$validator = Validator::make($data, $this->rules);

		if ($validator->fails()) {
			return $validator->messages();
		}
		return;
	}
}


Validator::extend('array_of_privileges', function ($attribute, $value, $parameters) {
	if (!is_array($value)) return false;
	foreach ($value as $privilege) {
		$filtered = array_filter(Group::$privilegeList, function ($p) use ($privilege) {
			return $p['privilege'] == $privilege;
		});
		if (empty($filtered)) return false;
	}
	return true;
});
