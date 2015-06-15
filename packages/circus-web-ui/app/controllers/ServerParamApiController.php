<?php

/**
 * デフォルトドメイン設定UI
 * @author stani
 */
class ServerParamApiController extends ResourceApiBaseController {
	protected $targetClass = 'ServerParam';
	protected $fields = null;
	protected $settable = null;

	function __construct() {
		$serverParam = new ServerParam();
		$fields = array_keys($serverParam->getRules());
		$this->fields = $fields;
		$this->settable = $fields;
	}


	/**
	 * Returns one resource item.
	 * @param $id int The resource ID.
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show($id)
	{
		$class = $this->targetClass;
		$item = $class::findOrFail($id, $this->fields)->toArray();
		$this->showFilter($item);
		return Response::json($item);
	}

	/**
	 * Updates current model.
	 * @param $id string ID of the edit target.
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update($id)
	{
		if (!Request::isJson()) App::abort(400);
		$class = $this->targetClass;
		$item = $class::findOrFail($id);
		$data = Input::all();
		try {
			return $this->bulkAssignPostedDataToModel($item, $data, false)
				->validateAndSave($item);
		} catch (InvalidModelException $e) {
			return $this->errorResponse($e->getErrors());
		}
	}
}