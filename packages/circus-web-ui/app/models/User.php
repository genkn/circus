<?php

use Illuminate\Auth\UserTrait;
use Illuminate\Auth\UserInterface;

/**
 * User model
 *
 * @property string userID
 * @property string loginID
 * @property string password The hashed password
 * @property array groups List of groups to which this user belongs
 * @property array preferences
 * @property bool loginEnabled
 * @property MongoDate lastLoginTime
 * @property string lastLoginIP
 */
class User extends BaseModel implements UserInterface {
	use UserTrait;

	const COLLECTION = 'Users';
	protected $collection = self::COLLECTION;
	protected $primaryKey = 'userID';

	protected $rules = array(
		'userID' => 'required|strict_integer|min:1',
        'loginID'	=>	'required|alpha_dash|max:20',
		'password'	=>	'required',
		'groups' => 'required|array_of_group_ids',
		'preferences' => 'required|preferences',
		'loginEnabled' => 'required|strict_bool',
		'lastLoginTime' => 'mongodate',
		'lastLoginIP' => '',
		'description' => '',
		'createTime'		=>	'mongodate',
		'updateTime'		=>	'mongodate'
    );

	protected $messages = array(
		'userID.strict_integer' => 'Please be userID is set in numeric type .',
		'groups.array_of_group_ids' => 'Invalid group ID list.',
		'loginEnabled.strict_bool' => 'Please be loginEnabled is set in bool type .'
	);

	public function groups() {
		return $this->belongsToMany('Group', null, 'users', 'groups');
	}

	/**
	 * Validate Check
	 * @param $data Validate checked
	 * @return Error content
	 * @deprecated Do not use. Use selfValidate
	 */
	public function validate($data) {
		$validator = Validator::make($data, $this->rules);

		if ($validator->fails()) {
			return $validator->messages();
		}
		return;
	}

}

Validator::extend('preferences', function ($attribute, $value, $parameters) {
	return is_array($value)
		&& isset($value['theme'])
		&& $value['theme'] === 'mode_white' || $value['theme'] === 'mode_black'
		&& isset($value['personalInfoView'])
		&& $value['personalInfoView'] === true || $value['personalInfoView'] === false;
});
