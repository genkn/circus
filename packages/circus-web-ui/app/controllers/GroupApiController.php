<?php

class GroupApiController extends ResourceApiBaseController
{
	protected $fields = array('groupID', 'groupName', 'privileges', 'domains');
	protected $targetClass = 'Group';
	protected $settable = ['groupName', 'privileges', 'domains'];

	public function listPrivileges() {
		return Response::json(Group::$privilegeList);
	}
}
