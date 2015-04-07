@extends('common.layout')

@section('page_css')
{{HTML::style('css/ui-lightness/jquery-ui-1.10.4.custom.min.css')}}
{{HTML::style('css/jquery.flexforms.css')}}
{{HTML::style('css/page.css')}}
@stop

@section('page_js')
{{HTML::script('js/jquery-ui.min.js')}}
{{HTML::script('js/jquery.multiselect.min.js')}}
{{HTML::script('js/jquery.formserializer.js')}}
{{HTML::script('js/jquery.flexforms.js')}}
{{HTML::script('js/more_search.js')}}
@if (isset($inputs['mongo_search_data']))
<script>
	var detail_keys = {{$inputs['mongo_search_data']}};
</script>
@endif
<script>
	$(function() {
		// Initialization parameter
		var keys = {{Helper\ConfigHelper::getDetailSearchConfig()}};

		var filter = $('#search_condition')
		.filtereditor({keys: keys})
		.on('filterchange', function () {
			var data;
			if (typeof detail_keys != 'undefined') {
				data = filter.filtereditor('option', 'filter', detail_keys);
			} else {
				data = filter.filtereditor('option', 'filter');
				var node = JSON.stringify(data, null, '  ');
			}
		});
		filter.trigger('filterchange');

		//Save Settings depression during treatment
		$('#save-button').click(function(){
			var ret = prompt('Please display the save label name.', 'User set condition');
			if (ret == null){
				alert('Please display the save label name.');
			} else {
				sendAjax("{{asset('case/save_search')}}", setAjaxSearchVal("btnSave", {"name":"save_label","value":ret}));
			}
			return false;
		});

		$('#btn_submit').click(function(){
			//Ajax
			var target_elm = $('#result_case_list');
			var btnName = arguments[1] ? arguments[1] : "btnSearch";
			var sendData = setAjaxSearchVal(btnName);
			sendAjax("{{asset('case/search_result')}}", sendData, target_elm);
			$('#temporaly_form').remove();
			return false;
		});
		//I want to create a data for Ajax communication
		function setAjaxSearchVal(btnName) {
			var form_data = $('#form_case_search').serializeArray();
			//Condition generation of project ID
			var project_id_ary = [];
			for (var i = 0; i < form_data.length; i++) {
				if (form_data[i]["name"] == "project") {
					project_id_ary.push(form_data[i]["value"]);
					delete form_data[i];
				}
			}
			//Get search mode
			var search_mode = $('#search_mode').val();
			var tmp_ary_data = [];

			var tmp_project_data = {"name":"project", "value" : JSON.stringify(project_id_ary)};
			var tmp_action_btn_data = {"name":btnName, "value":btnName};
			var tmp_search_mode_data = {"name":"search_mode", "value":search_mode};

			//Advanced Search
			if (search_mode == 1) {
				var mongo_val = filter.filtereditor('exportMongo');
				var tmp_mongo_data = {"name":"mongo_data","value" : JSON.stringify(mongo_val)};
				if (btnName == "btnSave") {
					var mongo_search_val = filter.filtereditor('option', 'filter');
					var tmp_mongo_search_data = {"name":"mongo_search_data","value" : JSON.stringify(mongo_search_val)};
					tmp_ary_data= [tmp_mongo_data, tmp_project_data,tmp_action_btn_data,tmp_search_mode_data, tmp_mongo_search_data];
				} else {
					tmp_ary_data= [tmp_mongo_data, tmp_project_data,tmp_action_btn_data,tmp_search_mode_data];
				}
			} else {
			//Simple Search
				var tmp_data = [tmp_project_data,tmp_action_btn_data,tmp_search_mode_data];
				tmp_ary_data = $.extend(true,form_data, tmp_data);
			}

			//Option
			if (arguments[1]) {
				tmp_ary_data.push(arguments[1]);
			}
			//var tmp_data = $.extend(true,form_data, tmp_ary_data);
			return tmp_ary_data;
		}


		$('#btn_reset').click(function(){
			//Event firing
			$('#btn_submit').trigger('click', "btnReset");
		});
		//Ajax通信
		function sendAjax(post_url, post_data, target_elm) {
			$.ajax({
				url: post_url,
				type: 'POST',
				data: post_data,
				dataType: 'json',
				error: function(){
					alert('I failed to communicate.');
				},
				success: function(res){
					if (typeof target_elm != "undefined") {
						target_elm.empty();
						target_elm.append(res.response);
					} else {
						alert(res.message);
					}
				}
			});
		}
	});
</script>
@stop

@section('title')
Case Search
@stop

@section('page_title')
Case Search
@stop


@section('content')
<div class="search_form_wrap">
	<h2 class="con_ttl">Search Condition</h2>
	<div id="search_condition_outer">
		{{Form::open(['url' => asset('case/search'), 'method' => 'POST', 'class' => 'common_form', 'id' => 'form_case_search'])}}
			{{Form::hidden('search_mode', isset($inputs['search_mode']) ? $inputs['search_mode'] : 0, array('id' => 'search_mode'))}}
			<table class="common_table al_l mar_b_10">
				<colgroup>
					<col width="15%">
					<col width="35%">
					<col width="15%">
					<col width="35%">
				</colgroup>
				<tbody>
					<tr>
						<th>project ID</th>
						<td colspan="3">
							{{Form::select('project', $project_list, isset($inputs['project']) ? $inputs['project'] : null, array('class' => 'multi_select', 'multiple' => 'multiple'))}}
						</td>
					</tr>
				</tbody>
			</table>
			@if (!isset($inputs['search_mode']) || (isset($inputs['search_mode']) && $inputs['search_mode'] == 0))
				<div id="easy_search">
			@else
				<div id="easy_search" class="hidden">
			@endif
				<table class="common_table al_l mar_b_10">
					<colgroup>
						<col width="15%">
						<col width="35%">
						<col width="15%">
						<col width="35%">
					</colgroup>
					<tbody>
						<tr>
							<th>Case ID</th>
							<td>
								{{Form::hidden('dummyID', isset($inputs['caseID']) ? $inputs['caseID'] : '')}}
								{{Form::text('caseID', isset($inputs['caseID']) ? $inputs['caseID'] : '', array('class' => 'common_input_text w_200'))}}
							</td>
							<th>Patient ID</th>
							<td>{{Form::text('patientID', isset($inputs['patientID']) ? $inputs['patientID'] : '', array('class' => 'common_input_text w_200'))}}</td>
						</tr>
						<tr>
							<th>Patient Name</th>
							<td>{{Form::text('patientName', isset($inputs['patientName']) ? $inputs['patientName'] : '', array('class' => 'common_input_text w_200'))}}</td>
							<th>Create Date</th>
							<td>{{Form::text('createDate', isset($inputs['createDate']) ? $inputs['createDate'] : '', array('class' => 'common_input_text w_200 datepicker'))}}</td>
						</tr>
						<tr>
							<th>Update Date</th>
							<td>{{Form::text('updateDate', isset($inputs['updateDate']) ? $inputs['updateDate'] : '', array('class' => 'common_input_text w_200 datepicker'))}}</td>
							<th>Case Date</th>
							<td>{{Form::text('caseDate', isset($inputs['caseDate']) ? $inputs['caseDate'] : '', array('class' => 'common_input_text w_200 datepicker'))}}</td>
						</tr>
					</tbody>
				</table>
			</div>
			{{Form::button($inputs['search_mode'] == 0 ? 'Show More Options' : 'Hidden More Options', array('id' => 'search_detail', 'class' => 'common_btn mar_b_10', 'onClick' => "more_search();"))}}
		{{Form::close()}}
		@if (isset($inputs['search_mode']) && $inputs['search_mode'] == 1)
			<div id="search_condition">
		@else
			<div id="search_condition" class="hidden">
		@endif
		</div>
		<p class="submit_area">
			{{Form::button('Reset', array('class' => 'common_btn common_btn_green clearForm', 'type' => 'reset', 'id' => 'btn_reset', 'name' => 'btnReset'))}}
			{{Form::button('Search', array('class' => 'common_btn common_btn_gray', 'id' => 'btn_submit', 'type' => 'button', 'name' => 'btnSubmit'))}}
			{{Form::button('Save settings', array('class' => 'common_btn common_btn_gray', 'id' => 'save-button', 'type' => 'button', 'name' => 'btnSave'))}}
		</p>
	</div>
</div>
<div class="search_result pad_tb_5" id="result_case_list">
@include('case.case')
</div>
@stop