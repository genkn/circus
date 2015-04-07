Download Volume
{{Form::open(['url' => asset('series/export'), 'method' => 'post', 'id' => 'frm_export'])}}
	{{Form::hidden('seriesUID', $series_detail->seriesUID)}}

	<div class="input_form_area">
		<h2 class="con_ttl"> Range (image number) </h2>
		<div class="slider_outer" id="slider_export">
		</div>
		<div class="al_r">
			{{Form::text('export_start_img', 1, array('id' => 'exportStSeriesImg', 'class' => 'common_input slider_txt'))}} -
			{{Form::text('export_end_img', '', array('id' => 'exportEdSeriesImg', 'class' => 'common_input slider_txt'))}}
			{{Form::button('All', array('id' => 'btnAll', 'class' => 'common_btn'))}}
		</div>
		<div class="al_l">
			Description:
			{{Form::select('direction', array('auto' => 'Auto', 'forward' => 'Forward', 'reverse' => 'Reverse'), 'auto', array('class' => 'select w_180'))}}
		</div>
	</div>
{{--
	<div class="input_form_area">
		<h2 class="con_ttl"> Options </h2>
		<div>
			Required private tags:
			{{Form::text('tags', '')}}
		</div>
	</div>
--}}
	<div class="al_r">
		{{Form::button('Download', array('class' => 'common_btn al_r', 'id' => 'btnSeriesDownload'))}}
		{{Form::button('Close', array('class' => 'common_btn al_r', 'id' => 'btnExportCancel'))}}
	</div>
	<span id="export_err" class="font_red"></span>
{{Form::close()}}
<script>
var sliderRun = function() {
	$('#slider_export').slider({
		min: 0,
		max: series_slider_max,
		step: 1,
		values: [1, series_slider_max],
		range:true,
		//スライダーの変化時にテキストボックスの値表示を更新
		change: function(e, ui) {
			$('#exportStSeriesImg').val(ui.values[0]);
			$('#exportEdSeriesImg').val(ui.values[1]);
		},
		//スライダーの初期化時に、その値をテキストボックスにも反映
		create: function(e, ui) {
		//  $('#exportStSeriesImg').val($(this).slider('option', 'value'));
			var values = $(this).slider('option', 'values');
			$('#exportStSeriesImg').val(values[0]);
			$('#exportEdSeriesImg').val(values[1]);
		}
	});
}
$(function(){
	$('#btnSeriesDownload').click(function() {
		$('#export_err').empty();
		$('#frm_export').submit();
		return false;
	});

	$('#btnExportCancel').click(function() {
		$('.export_area').slideUp();
	});

	$('#btnAll').click(function() {
		sliderRun();
	});

	$('.slider_txt').on('change', function() {
		$('#slider_export').slider('values', [$('#exportStSeriesImg').val(), $('#exportEdSeriesImg').val()]);
	});
});
</script>