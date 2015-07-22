@extends('common.layout')

@section('head')
{{HTML::style('css/jquery-ui.css')}}
{{HTML::style('css/imageViewer.css')}}
{{HTML::style('css/jquery.simple-color-picker.css')}}

{{HTML::script('js/jquery-ui.min.js')}}
{{HTML::script('js/jquery.simple-color-picker.js')}}
{{HTML::script('js/jquery.base64.js')}}
{{HTML::script('js/canvastool.pngencoder.min.js')}}
{{HTML::script('js/gzip.min.js')}}
{{HTML::script('js/gunzip.min.js')}}
{{HTML::script('js/jquery.blockUI.js')}}
{{HTML::script('js/voxelContainer.js')}}
{{HTML::script('js/imageViewer.js')}}
{{HTML::script('js/imageViewerController.js')}}
{{HTML::script('js/jquery.flexforms.js')}}
{{HTML::script('js/export-common.js')}}

@if (!isset($error_msg))
	@if (!$edit_flg)
		<script type="text/javascript">
          var opt_control = {
            boldness: {
              active: false,
              value: 1
            }, //太さ変更
            bucket: {
              active: false,
              value: 1
            }, //太さ変更
            measure: {
              active: true,
              panel: true
            },
            color: {
              control: false
            },
            pan: true,
            window: {
              active : true,
              panel: false
            },
            pen: {
              active: false, //描画機能の有効・無効
              panel: false, //ラベル情報表示パネルの有無
            },
            show: true, //そもそもコントロールパネルを置くかどうか
            undo: false //戻す・やり直す一括
          };
		</script>
    @else
    	<script type="text/javascript">
			var opt_control = {
                    window : {
                panel : false
            }
        };
		</script>
    @endif
<script>
    //Label attributes default
    var default_label_attr_prop = {{$label_attribute_settings}};

    //Revision Attribute Properties
    var default_attr_prop = {{$case_attribute_settings}};
    var revisionNo = {{{$revisionNo}}};
    var parentLabelList = "disp_label_list";

    //Project-specific feature set to control the controller viewer widget
    $(function(){
        //Data group to pass when you ignite the controller immediately after page load
        //The controller 1 per group to be linked to multiple viewers
        var	voxel_container	= new voxelContainer();	//Label information storage object (three sides shared)
        voxel_container.name = 'my_voxel';

        var	initInfo	=	[
            {
                baseUrl : "{{{$server_url['dicom_img_base_url']}}}",
                postUrl : "{{asset('case/save_label')}}",	//Enable here if it is different from the image storage server
                caseId : "{{Session::get('caseID')}}",
                attribute : {{$attribute}},
                defaultLabelAttribute :default_label_attr_prop,
                series : {{$series_list}},
                control : opt_control,
                elements : {
                    parent : 'page_case_detail',
                    panel : 'the_panel_inner',
                    label : 'the_panel_inner',
                    labelAttribute : 'the_panel_inner',
                    revisionAttribute : 'revision_attribute_wrap'
                },
                viewer : [
                    {//First sheet
                        elementId : 'img_area_axial',
                        orientation : 'axial',
                        container : voxel_container,
                        number:{
                            maximum : 260, //What sheets cross section is stored
                            current : 0	//Initial display number
                        }
                    },
                    {//2nd sheet
                        elementId : 'img_area_sagittal',
                        orientation : 'sagittal',
                        container : voxel_container,
                        number:{
                            maximum : 511, //What sheets cross section is stored
                            current : 0	//Initial display number
                        }
                    },
                    {//3rd sheet
                        elementId : 'img_area_coronal',
                        orientation : 'coronal',
                        container : voxel_container,
                        number:{
                            maximum : 511, //What sheets cross section is stored
                            current : 0	//Initial display number
                        }
                    }
                ]
            }
        ]; //initInfo

        //accept a series information from node.js by performing a number worth of ajax of series
        var ajax_cnt = 0;
        var initAjax= function(){
            var tmp_series = initInfo[0].series[ajax_cnt];
            $.ajax({
                url: '{{{$server_url["series_path"]}}}',
                type: 'GET',
                data: {
                    series : tmp_series.id
                },//Transmitted data
                dataType: 'json',
                error: function(){
                    alert('I failed to communicate');
                },
                success: function(response){
                    //console.log(response);
                    if(typeof response.allow_mode != 'undefined'){
                        tmp_series.allow_mode = $.extend(true,tmp_series.allow_mode ,response.allow_mode);
                    }

                    //set 3D length settings
                    if(typeof tmp_series.voxel != 'object'){
                        tmp_series.voxel = new Object();
                    }

                    if(typeof response.voxel_x == 'number'){
                        tmp_series.voxel.voxel_x = response.voxel_x;
                    };

                    if(typeof response.voxel_y == 'number'){
                        tmp_series.voxel.voxel_y = response.voxel_y;
                    };

                    if(typeof response.voxel_z == 'number'){
                        tmp_series.voxel.voxel_z = response.voxel_z;
                    };

                    if(typeof response.x == 'number'){
                        tmp_series.voxel.x = response.x;
                    };

                    if(typeof response.y == 'number'){
                        tmp_series.voxel.y = response.y;
                    };

                    if(typeof response.z == 'number'){
                        tmp_series.voxel.z = response.z;
                    };

                    //set window settings

                    if(typeof tmp_series.window != 'object'){
                        tmp_series.window = new Object();
                    }

                    if(typeof tmp_series.window.level != 'object'){
                        tmp_series.window.level = new Object();
                    }

                    if(typeof tmp_series.window.width != 'object'){
                        tmp_series.window.width = new Object();
                    }

                    if(typeof response.window_level == 'number'){
                        tmp_series.window.level.current = response.window_level;
                    };

                    if(typeof response.window_width == 'number'){
                        tmp_series.window.width.current = response.window_width;
                    };

                    //set init window settings by Series Window Priority.
                    var priority_array = ['preset','dicom','auto']; //priority default

                    if(typeof tmp_series.window.priority == 'string'){
                        priority_array = tmp_series.window.priority.split(',');
                    }

                    for(var i=0; i<priority_array.length; i++){
                        if(priority_array[i] == 'preset' && typeof tmp_series.window.preset == 'object' && tmp_series.window.preset.length>0){
                            tmp_series.window.level.current = tmp_series.window.preset[0].level;
                            tmp_series.window.width.current = tmp_series.window.preset[0].width;
                            break;
                        }else if(priority_array[i] == 'dicom' && typeof response.window_level_dicom == 'number' && typeof response.window_width_dicom == 'number'){
                            tmp_series.window.level.current = response.window_level_dicom;
                            tmp_series.window.width.current = response.window_width_dicom;
                            break;
                        }else if(priority_array[i] == 'auto' && typeof response.window_level == 'number' && typeof response.window_width == 'number'){
                            tmp_series.window.level.current = response.window_level;
                            tmp_series.window.width.current = response.window_width;
                            break;
                        }
                    }

                    if(typeof tmp_series.window.preset != 'object'){
                        tmp_series.window.preset = new Array(0);
                    }

                    //set dicom-written-info into the last of Preset array.
                    if(typeof response.window_level_dicom == 'number' && typeof response.window_width_dicom == 'number'){
                        var tmp_preset_dicom = {
                            label: 'dicom' ,
                            level: response.window_level_dicom ,
                            width: response.window_width_dicom
                        }
                        tmp_series.window.preset.push(tmp_preset_dicom);
                    };

                    //set auto-info into the last of Preset array.
                    if(typeof response.window_level == 'number' && typeof response.window_width == 'number'){
                        var tmp_preset_auto = {
                            label: 'auto' ,
                            level: response.window_level ,
                            width: response.window_width
                        }
                        tmp_series.window.preset.push(tmp_preset_auto);
                    };

                    if(typeof response.window_level_max == 'number'){
                        tmp_series.window.level.maximum = response.window_level_max;
                    };

                    if(typeof response.window_level_min == 'number'){
                        tmp_series.window.level.minimum = response.window_level_min;
                    };

                    if(typeof response.window_width_max == 'number'){
                        tmp_series.window.width.maximum = response.window_width_max;
                    };

                    if(typeof response.window_width_min == 'number'){
                        tmp_series.window.width.minimum = response.window_width_min;
                    };

                    for(var i=0; i<initInfo[0].viewer.length; i++){
                        var tmp_viewer = initInfo[0].viewer[i];
                        if(tmp_viewer.orientation == 'axial'){
                            tmp_viewer.number.maximum = response.z;
                        }else if(tmp_viewer.orientation == 'coronal'){
                            tmp_viewer.number.maximum = response.y;
                        }else if(tmp_viewer.orientation == 'sagittal'){
                            tmp_viewer.number.maximum = response.x;
                        }
                    }

                    if(ajax_cnt==initInfo[0].series.length-1){
                        controllerRun();
                    }else{
                        ajax_cnt++;
                        initAjax();
                    }
                }
            });

        }//initAjax
        initAjax();//ajax firing

        var controllerRun = function() {
            //fire the controllers to the once per synchronized eries
            for (var j = 0; j < initInfo.length; j++) {
                $('#' + initInfo[j].wrapElementId).imageViewerController('init', initInfo[j]);
                //insert & display revision attribute
                var insert_prop = {
                    properties: default_attr_prop
                };
                if (typeof initInfo[j].attribute != 'undefined') {
                    insert_prop.value = initInfo[j].attribute;
                }
                $('#' + initInfo[j].elements.revisionAttribute).propertyeditor(insert_prop);
            }
        }//controllerRun



        $('#btnBack').click(function() {
            var this_elm = $(this);
            $('#' + initInfo[0].wrapElementId).imageViewerController('checkUpdateLabel');
            var tmp_changed_label_num = $('#' + initInfo[0].wrapElementId).imageViewerController('changedLabelNum');
            var runBtnBackSubmit = function() {
                //$('body').append('<form action="./search" method="POST" class="hidden" id="frm_back"></form>');
                $('body').append('<form action="{{{asset($backUrl)}}}" method="POST" class="hidden" id="frm_back"></form>');
                $('#frm_back').append('<input type="hidden" name="btnBack" value="">').submit();
            }
            if (tmp_changed_label_num == 0) {
                runBtnBackSubmit();
            } else {
                $('#unload_dialog').dialog({
                    buttons: [{
                        text: "ignore",
                        click: function() {
                            runBtnBackSubmit();
                        }
                    }, {
                        text: "stay",
                        click: function() {
                            $('#unload_dialog').dialog('close');
                        }
                    }]
                }); //#unload_dialog .dialog
            }
            return false;
        });



        $('.link_case_detail').click(function(){
            changeRevision($(this).closest('td').find("input[name='revisionNo']").val(), 'detail');
        });

        $('.link_case_edit').click(function(){
            changeRevision($(this).closest('td').find("input[name='revisionNo']").val(), 'edit');
        });



		$('.select_revision').focus(function(){
				var this_elm = $(this);
				var before_change_value = this_elm.val();
				this_elm.attr('before-change-value',before_change_value)
		});



        $('.select_revision').change(function() {
            var this_elm = $(this);
            $('#' + initInfo[0].wrapElementId).imageViewerController('checkUpdateLabel');
            var tmp_changed_label_num = $('#' + initInfo[0].wrapElementId).imageViewerController('changedLabelNum');
            if (tmp_changed_label_num == 0) {
                changeRevision(this_elm.val());
            } else {
                $('#unload_dialog').dialog({
                    beforeClose: function() {
                        this_elm.val(this_elm.attr('before-change-value'));
                    },
                    buttons: [{
                        text: "ignore",
                        click: function() {
                            changeRevision(this_elm.val());
                        }
                    }, {
                        text: "stay",
                        click: function() {
                            $('#unload_dialog').dialog('close');
                        }
                    }]
                }); //#unload_dialog .dialog
            }
        });


        $('.link_add_series').click(function(){
            $('.frm_add_series').submit();
            return false;
        });

    });

    var getLabelList = function(active_series_ld) {
        $('#export_err').empty();
        var export_data = {caseID: "{{{$case_detail->caseID}}}", seriesUID:active_series_ld, revisionNo:revisionNo};
        //get label list of the revision
        $.ajax({
           url: "{{{asset('case/get_label_list')}}}",
           type: 'post',
           data: export_data,//送信データ
           dataType: 'json',
           error: function () {
             alert('I failed to communicate.');
           },
           success: function (response) {
             createLabelList(response.label_list, active_series_ld);
           }
       });
    }


    var createLabelList = function(label_list, active_series_id) {
        //初期化
				$('#exportSeriesUID').empty().append(active_series_id);
				$('.exportSeriesUID').val(active_series_id);
				$('.'+parentLabelList).empty();
				var the_insert_elm = '';
				$.each(label_list, function(idx, val) {
					the_insert_elm = the_insert_elm +'<li class="ui-state-dafault"><label>';
					the_insert_elm = the_insert_elm +'<input type="checkbox" value="'+idx+'" id="export_label_idx'+idx+'" name="labels[]" class="export_labels">Label'+idx;
					the_insert_elm = the_insert_elm +'</label></li>';
				});
				$('.'+parentLabelList).append(the_insert_elm);
    }
    var changeRevision = function(index) {
        if (arguments[1])
            $('#frm_change_revision').find("input[name='mode']").val(arguments[1]);
        $('.change_revision').val(index);
        $('#frm_change_revision').submit();
        return false;
    }

    var getRevisionList = function() {
        var result_flag = $.ajax({
            url: "{{{asset('case/get_revision_list')}}}",
            type: 'post',
            data: {caseID:"{{{$case_detail->caseID}}}"},//送信データ
            dataType: 'json',
            error: function () {
                alert('Revision information acquisition failed .');
                return false;
            },
            success: function (res) {
                if (res.status === "OK") {
                    create_dom(res.response);
                    return true;
                }
                return false;
            }
        });

        var create_dom = function(insert_obj){
            //setting revision combobox
            $('.select_revision').empty();
            $('#exportRevisionNo').empty();
            var parent = $('.select_revision');
            var opt_tag = "";
            for(var i = 0; i < insert_obj.revision_no_list.length; i++) {
                if (i === insert_obj.revision_no_list.length - 1) {
                    opt_tag = parent.append("<option value='"+i+"' selected>"+i+"</option>");
                    $('#exportRevisionNo').append(i);
                    $('.exportRevisionNo').val(i);
                    revisionNo = i;
                } else {
                    opt_tag = parent.append("<option value='"+i+"'>"+i+"</option>");
                }
            }

            //setting revision list
            $('.result_revision_list').empty();
            $.each(insert_obj.revision_list, function(i, val) {
                var tbl_tag = "<tr><td>"+val['revisionNo']+"</td>";
                tbl_tag += "<td>"+val['editDate']+"<br>"+val['editTime']+"</td>";
                tbl_tag += "<td>"+val['seriesCount']+" series<br>"+val['labelCount']+" label</td>";
                tbl_tag += "<td>"+val['creator']+"</td>";
                tbl_tag += "<td class='al_l'>"+val['memo']+"</td>";
                tbl_tag += "<td><input type='hidden' name='revisionNo' value='"+val['revisionNo']+"'>";
                tbl_tag += "<button type='button' class='common_btn link_case_detail'>View</button></td></tr>";
                $('.result_revision_list').append(tbl_tag);
            });

            $('.link_case_detail').click(function(){
                changeRevision($(this).closest('td').find("input[name='revisionNo']").val(), 'detail');
            });

            $('.link_case_edit').click(function(){
                changeRevision($(this).closest('td').find("input[name='revisionNo']").val(), 'edit');
            });
        }
        return result_flag;
    }

</script>
@endif
@stop

@section('title')
@if(isset($error_msg))
	Case Detail
@else
	Case Detail (Revision {{{$revisionNo}}})
@endif
@stop

@section('page_id')
id="page_case_detail"
@stop

@section('content')
<div class="al_l mar_b_10 w_600 fl_l">
	{{HTML::link(asset('case/search'), 'Back to Case Search Result', array('class' => 'common_btn', 'id' => 'btnBack'))}}
	@if(!isset($error_msg) && $add_series_flg)
		{{HTML::link(asset('series/search'), 'Add Series', array('class' => 'common_btn link_add_series'))}}
		{{Form::open(['url' => asset('series/search'), 'method' => 'POST', 'class' => 'frm_add_series'])}}
			{{Form::hidden('edit_case_id', $case_detail->caseID)}}
		{{Form::close()}}
	@endif
</div>

@if (isset($error_msg))
	<br><span class="font_red">{{$error_msg}}</span>
@else
	<div class="al_r mar_b_10 w_300 fl_r">
		{{Form::select('revision', $revision_no_list, $revisionNo, array('class' => 'select w_180 select_revision'))}}
		{{HTML::link(asset('case/detail#revision'), 'Revision List', array('class' => 'common_btn'))}}
	</div>
	<div class="clear">&nbsp;</div>
	<table class="common_table al_l mar_b_10">
		<colgroup>
			<col width="20%">
			<col width="80%">
		</colgroup>
		<tr>
			<th>Case ID</th>
			<td>{{$case_detail->caseID}}</td>
		</tr>
		<tr>
			<th>Project Name</th>
			<td>{{$case_detail->project->projectName}}</td>
		</tr>
	</table>
	<div class="w_400 fl_l">
		{{Form::open(['url' => asset('case/detail'), 'method' => 'post'])}}
		@if ($edit_flg)
			<button type='button' class='common_btn btn_save' name='btnSave'>
				<span style="background:url({{asset('/img/common/ico_save.png')}}) no-repeat; width:22px; height:22px; display:inline-block; margin-bottom:-7px; margin-right:4px;"></span>
				Save
			</button>
		@endif
			<button type="button" class="common_btn btn_export">
				Export
			</button>
		{{Form::close()}}
	</div>
	<div class="w_500 fl_r">
	@if(Auth::user()->hasPrivilege(Group::PERSONAL_INFO_VIEW))
		<div class="info_area">
			<p class="pad_10">
				{{$case_detail->patientInfoCache['patientName']}} ({{$case_detail->patientInfoCache['patientID']}})
				<br>{{$case_detail->patientInfoCache['birthDate']}} {{CommonHelper::getSex($case_detail->patientInfoCache['sex'])}}
			</p>
		</div>
	@endif
	</div>
	<div class="clear">&nbsp;</div>
	<div class="export_area" style="display:none;">
		<div class="pad_20">
			@include('case.export')
		</div>
	</div>

	<div class="error_area mar_b_10" style="display:none;">
		<div class="pad_20">
			<p class="error_detail">
				Error: <br>Data of <span class="error_label_list"></span> is incorrect.
			</p>
			<p class="btn_close_error">閉じる</p>
		</div>
	</div>

	<div class="control_panel mar_tb_10" id="the_panel">
		<div class="control_panel_inner" id="the_panel_inner">
			<div class="info_area">
				<div class="control_panel_inner" id="revision_attribute_wrap"></div>
			</div>
		</div>
	</div>


	<div class="clear">&nbsp;</div>
	<div class=" img_view_area">
		<div class="img_area fl_l mar_b_20" id="img_area_axial"></div>
		<div class="img_area fl_r mar_b_20" id="img_area_sagittal"></div>
		<div class="clear">&nbsp;</div>
		<div class="img_area fl_l mar_b_20" id="img_area_coronal"></div>
		<div class="clear">&nbsp;</div>
	</div>
	<div class="search_result">
		<a name="revision"></a>
		<h2 class="con_ttl">Revision</h2>
		<div class="pad_tb_10">
			<table class="result_table common_table al_c">
				<thead>
					<colgroup>
						<col width="14%">
						<col width="14%">
						<col width="14%">
						<col width="14%">
						<col width="34%">
						<col width="10%">
					</colgroup>
					<tr>
						<th>Revision No.</th>
						<th>Edit Datetime</th>
						<th>Series/Label</th>
						<th>Editor Name</th>
						<th>Editor Memo</th>
						<th></th>
					</tr>
				</thead>
				<tbody class="result_revision_list">
					@if (count($revision_list))
						@foreach ($revision_list as $rec)
							<tr>
								<td>{{$rec['revisionNo']}}</td>
								<td>
									{{$rec['editDate']}}<br>
									{{$rec['editTime']}}
								</td>
								<td>
									{{$rec['seriesCount']}} series<br>
									{{$rec['labelCount']}} label
								</td>
								<td>{{$rec['creator']}}</td>
								<td class="al_l">{{$rec['memo']}}</td>
								<td>
									{{Form::hidden('revisionNo', $rec['revisionNo'])}}
									{{Form::button('View', array('class' => 'common_btn link_case_detail'))}}
								</td>
							</tr>
						@endforeach
					@else
						<tr>
							<td colspan="6">Revision is not registered.</td>
						</tr>
					@endif
				</tbody>
			</table>
		</div>
	</div>
	<div id="unload_dialog" hidden>
		There are unsaved data.
		<br>are you sure move to other page?
	</div>
	{{Form::open(['url' => asset('case/detail'), 'method' => 'post', 'id' => 'frm_change_revision'])}}
		{{Form::hidden('revisionNo', $revisionNo, array('class' => 'change_revision'))}}
		{{Form::hidden('caseID', $case_detail->caseID)}}
		{{Form::hidden('mode', $mode)}}
	{{Form::close()}}
@endif
@stop