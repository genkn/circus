Export volume data (Series: <span id="exportSeriesUID"></span>, Revision: {{{$revisionNo}}})
<hr>
{{Form::open(['url' => asset('case/export'), 'method' => 'post', 'id' => 'frm_export'])}}
	{{Form::hidden('caseID', $case_detail->caseID)}}
	{{Form::hidden('revisionNo', $revisionNo)}}
	{{Form::hidden('seriesUID', '', array('class'=>'exportSeriesUID'))}}

	(Data type)
	<ul>
		<li>
			{{Form::radio('data_type', ClinicalCase::DATA_TYPE_ORIGINAL, $inputs['data_type'] == ClinicalCase::DATA_TYPE_ORIGINAL ? true : false, array('id' => 'data_type_original', 'class' => 'data_type'))}}
			{{Form::label('data_type_original', 'Original volume only')}}
		</li>
		<li>
			{{Form::radio('data_type', ClinicalCase::DATA_TYPE_LABEL, $inputs['data_type'] == ClinicalCase::DATA_TYPE_LABEL ? true : false, array('id' => 'data_type_label', 'class' => 'data_type'))}}
			{{Form::label('data_type_label', 'Labeled volume only')}}
		</li>
		<li>
			{{Form::radio('data_type', ClinicalCase::DATA_TYPE_ORIGINAL_LABEL, $inputs['data_type'] == ClinicalCase::DATA_TYPE_ORIGINAL_LABEL ? true : false, array('id' => 'data_type_both', 'class' => 'data_type'))}}
			{{Form::label('data_type_both', 'Original volume + Labeled volume')}}
		</li>
	</ul>

	<div class="input_form_area">
		<h2 class="con_ttl">Label Options</h2>
		<table class="common_table mar_b_10"">
			<tr>
				<th>Type:</th>
				<td>
					<ul>
						<li>
							{{Form::radio('output_type', ClinicalCase::OUTPUT_TYPE_SEPARATE, $inputs['output_type'] == ClinicalCase::OUTPUT_TYPE_SEPARATE ? true : false, array('id' => 'output_type_separate'))}}
							{{Form::label('output_type_separate', 'Separated')}}
						</li>
						<li>
							{{Form::radio('output_type', ClinicalCase::OUTPUT_TYPE_COMBI, $inputs['output_type'] == ClinicalCase::OUTPUT_TYPE_COMBI ? true : false, array('id' => 'output_type_combi'))}}
							{{Form::label('output_type_combi', 'Combined')}}
						</li>
					</ul>
				</td>
			</tr>
			<tr>
				<td colspan="2">
					<div id="series_order_wrap" class="w_500">
						<ul class="ui-sortable disp_label_list">
						</ul>
					</div>
				</td>
			</tr>
		</table>
		<div class="al_r">
		{{Form::button('Download', array('class' => 'common_btn al_r', 'id' => 'btnCaseDownload'))}}
		{{Form::button('Cancel', array('class' => 'common_btn al_r', 'id' => 'btnExportCancel'))}}
		</div>
		<span id="export_err" class="font_red"></span>
	</div>
{{Form::close()}}
<script>
$(function(){
	$('#btnCaseDownload').click(function() {
		$('#export_err').empty();

		var export_data_type = $('.data_type:checked').val();

		if (export_data_type == {{{ClinicalCase::DATA_TYPE_LABEL}}} ||
			export_data_type == {{{ClinicalCase::DATA_TYPE_ORIGINAL_LABEL}}}) {
			if ($('.export_labels:checked').length == 0) {
				$('#export_err').append('Please select the label one or more .');
				return false;
			}
		}
		$('#frm_export').submit();
		return false;
	});

	$('#btnExportCancel').click(function() {
		$('.export_area').slideUp();
	});
});
</script>