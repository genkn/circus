<div id="dialog" title="Setting export options" style="display: none;">
    <p class="mar_10">
        {{Form::open(array('url' => asset('share/export'), 'method' => 'post', 'class' => 'frm_share_export'))}}
            {{Form::hidden('export_type', '')}}
            <table class="common_table">
                <tr>
                    <th>Personal Info</th>
                    <td>
                        {{Form::radio('personal', 1, (!isset($inputs['personal']) ||  $inputs['personal'] == 1) ? true : false, array('id' => 'personal_include'))}}
                        {{Form::label('personal_include', 'include')}}
                        {{Form::radio('personal', 0, isset($inputs['personal']) && $inputs['personal'] == 0 ? true : false, array('id' => 'personal_not_include'))}}
                        {{Form::label('personal_not_include', 'not include')}}
                    </td>
                </tr>
                <tr>
                    <th>Tag</th>
                    <td>
                        {{Form::select('tag', isset($tag_list) ? $tag_list : array(), isset($inputs['tags']) ? $inputs['tags'] : null, array('class' => 'multi_select export_select_tags export_option_tag', 'multiple' => 'multiple'))}}
                    </td>
                </tr>
            </table>
            <p class="submit_area">
                {{Form::button('Export', array('class' => 'common_btn common_btn_gray', 'id' => 'btn_export_case', 'type' => 'button', 'name' => 'btnExport'))}}
            </p>
        {{Form::close()}}
    </p>
    <div id="progress"><div id="progress-label"></div></div>
    <div id="task-watcher"></div>
</div>


<script>


var exportRun = function (validate_flag) {
    //エラーがあるのでExport処理を行わない
    if (!isExportRun(validate_flag))
        return;

    var parent_form = $('.frm_share_export');
    var personal = parent_form.find('input[name="personal"]:checked').val();
    var export_type = parent_form.find('input[name="export_type"]').val();

    var tag_ary = new Array();
    $('.export_option_tag option:selected').each(function(){
        tag_ary.push($(this).val());
    });
    var tag = JSON.stringify(tag_ary);

    var export_data = {"cases":$.cookie(COOKIE_NAME), "personal":personal,"tags":tag, "export_type":export_type};
    busy(true);
    var xhr = $.ajax({
        url: "{{{asset('share/export')}}}",
        type: 'post',
        data: export_data,
        dataType: 'json',
        async:true,
        xhr: myXhr,
        success: function (data) {
            $('#task-watcher').taskWatcher(data.taskID).on('finish', function() {
                downloadVolume(data.response);
                closeExportOptionDialog();
                busy(false);
            });
        },
        error: function (data) {
            closeExportOptionDialog();
            alert(data.responseJSON.errorMessage);
            busy(false);
        }
    });
}
$(function(){
    $('#btn_export_case').click(function(){
        exportRun(true);
        return false;
    });
});
</script>