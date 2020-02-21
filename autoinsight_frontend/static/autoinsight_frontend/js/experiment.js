var $FRONTEND = (function (module) {
    var _p = module._p = module._p || {};


    _p.dataset_name ="";
    var REFRESH_RUNTIMES_QUERY = `
                                    query {
                                      runtimes {
                                        id
                                        metric
                                        estimatorType
                                        modelsCnt
                                        doneSlot
                                        timeout
                                        randomState
                                        useTpot
                                        useAutosklearn
                                        useOptuna
                                        bestScore
                                        status
                                        scaleUnit
                                        workerScale
                                        createdAt
                                        containers {
                                          id
                                          containerId
                                          podName
                                          createdAt
                                          uuid
                                          exited
                                          status
                                        }
                                        dataset {
                                          id
                                          name
                                          targetName
                                          featureNames
                                        }
                                        processes {
                                          id
                                          runtimeType
                                          createdAt
                                          startedAt
                                          finishedAt
                                          stoppedAt
                                          containerUuid
                                          host
                                          pid
                                          killed
                                          stopRequest
                                          error
                                          errorMessage
                                        }
                                      }
                                    }
                                    `;

    //초기화면 세팅
    _p.init = function(){
        $.ajax({
            type: 'post',
            url: g_RESTAPI_HOST_BASE+'graphql',
            data: JSON.stringify({query:REFRESH_RUNTIMES_QUERY}),
            contentType: "application/json",
            success: function (resultData, textStatus, request) {
                //feature 개수, target column 추가
                $('#runtime_table').bootstrapTable({data: resultData.data.runtimes})

            },
            error: function (res) {
                console.log(res);
            }
        });

        $('#dataset').fileinput({
            uploadUrl: g_RESTAPI_HOST_BASE+"sources/workspace_files/",
            browseClass:'btn btn-default ',
            // language: "kr",
            maxFileSize: 2000000,
            msgPlaceholder: "Select a CSV or TSV file",
            elErrorContainer: '#kartik-file-errors5',
            showUpload: false,
            showRemove: false,
            showPreview: false,
            showBrowse: true,
            dropZoneEnabled: false,
            allowedFileExtensions: ["csv","tsv"],
            uploadExtraData: function (previewId, index) {
                var data = {};
                data.dataset_name=$('#dataset_name_input').val()
                data.sample_size = $('#sample_size').val()
                return data;
            }
        });
        $('#saved_dataset_area').hide();
        $('#source_type').change(function() {
            if ($(this).val() === 'saved') {
                $('#dataset_name_input').hide();
                $('#saved_dataset_area').show();
                $('#dataset').fileinput('disable');
            }else{
                $('#dataset_name_input').show();
                $('#saved_dataset_area').hide();
                $('#dataset').fileinput('enable');
            }
        });

        $('#dataset').on('fileuploaded', function (objectEvent, params){
            _p.createExperiment(params.response.id)

        });


    };


    _p.datasetFormatter =  function (value, row) {
        if(row.status === 'ready') {
            return '<a  href="/preprocess/'+row.id+'/" style="color: #337ab7; text-decoration: underline;">'+value.name+'</a><br>(target:'+value.targetName+', '+value.featureNames.length+'features)'
        }else{
            return '<a  href="/leaderboard/'+row.id+'/" style="color: #337ab7; text-decoration: underline;">'+value.name+'</a><br>(target:'+value.targetName+', '+value.featureNames.length+'features)'
        }

    }

    _p.progressFormatter =  function (value, row) {
        return Math.round(value / row.timeout * 100) + '%'
    }

    _p.workerscaleFormatter =  function (value, row) {
        var worker_scales = [1, 2, 3, 4]
        var selectBox ='<div class="wrap_select"><select id="workerscale_' + row.id + '" class="form-control" data-style="btn-info"'
        if(row.status === 'ready') {
            selectBox += 'onchange="$FRONTEND._p.updateScale(' + row.id + ')">'
        }else{
            selectBox += 'disabled>'
        }
        for (var i = 0; i < worker_scales.length; i++) {
            if (value === worker_scales[i]) {
                selectBox += '<option value="'+worker_scales[i]+'" selected>'+worker_scales[i]+'</option>'
            } else {
                selectBox += '<option value="'+worker_scales[i]+'">'+worker_scales[i]+'</option>'
            }
        }
        selectBox += '</select></div>';
        return selectBox
    }

    _p.actionFormatter = function(value, row){
        btnString=""
        if(row.status === 'ready'){
            btnString += '<button class="btn_m btn_border" type="button" onclick="$FRONTEND._p.startRuntime('+value+');">Start</button>'
            btnString += '<button class="btn_m btn_border" type="button" onclick="$FRONTEND._p.deleteRuntime('+value+');">Delete</button>'
        }
        else if(row.status === 'learning'){
            btnString += '<button class="btn_m btn_border" type="button" onclick="$FRONTEND._p.stopRuntime('+value+');">Stop</button>'
        }else{
            btnString += '<button class="btn_m btn_border" type="button" onclick="$FRONTEND._p.deleteRuntime('+value+');">Delete</button>'
        }
        return btnString

    }

    _p.addDataset = function() {
        $('.toggle-disable').prop('disabled', true)
        $('#preprocess_loader').addClass("loader")
        if($('#source_type').val()=="saved"){
            var data = {};
            data.dataset_name = $('#saved_dataset').val();
            if($('#sample_size').val() > 0) data.sample_size = $('#sample_size').val();


            return $.ajax({
                type: 'post',
                url: g_RESTAPI_HOST_BASE+"sources/from_sklearn_dataset/",
                data: data,
                dataType: 'json',
                success: function (resultData, textStatus, request) {
                    if (resultData['error_msg'] == null ){
                        _p.createExperiment(resultData.id)

                        // $('#runtime_table').bootstrapTable('refresh')
                    } else {
                        alert(resultData['error_msg']);
                    }
                    $('.toggle-disable').prop('disabled', false)
                    $('#preprocess_loader').removeClass("loader")
                },
                error: function (res) {
                    alert(res.responseJSON.message);
                    $('.toggle-disable').prop('disabled', false)
                    $('#preprocess_loader').removeClass("loader")
                }
            })
        }else {
            _p.dataset_name = $('#dataset_name_input').val();
            if (_p.dataset_name == "") {
                alert("Dataset 이름을 입력해 주세요.");
                return false;
            }
            $("#dataset").fileinput("upload");
        }
    };

    _p.createExperiment = function(source_id){
        return $.ajax({
                type: 'post',
                url: g_RESTAPI_HOST_BASE+"sources/"+source_id+"/experiment/",
                dataType: 'json',
                success: function (resultData, textStatus, request) {
                    if (resultData['error_msg'] == null ){
                        $('.modal').modal('hide');
                        location.reload()
                    } else {
                        alert(resultData['error_msg']);
                    }
                    $('.toggle-disable').prop('disabled', false)
                    $('#preprocess_loader').removeClass("loader")
                },
                error: function (res) {
                    alert(res.responseJSON.message);
                    $('.toggle-disable').prop('disabled', false)
                    $('#preprocess_loader').removeClass("loader")
                }
            })

    }

    _p.updateScale = function(runtime_id){
        var data = {};
        data.workerScale = $('#workerscale_' + runtime_id).val();
        return $.ajax({
                type: 'patch',
                url: g_RESTAPI_HOST_BASE+"runtimes/"+runtime_id+"/",
                dataType: 'json',
                data: data,
                success: function (resultData, textStatus, request) {
                    location.reload();
                },
                error: function (res) {
                    alert(res.responseJSON.message);
                }
            })

    }

    _p.startRuntime = function (runtime_id) {
        return $.ajax({
                type: 'post',
                url: g_RESTAPI_HOST_BASE+"runtimes/"+runtime_id+"/start/",
                dataType: 'json',
                success: function (resultData, textStatus, request) {
                    if (resultData['error_msg'] == null ){
                        alert("AutoML 구동을 시작합니다.");
                    } else {
                        alert(resultData['error_msg']);
                    }
                    location.reload();
                },
                error: function (res) {
                    alert(res.responseJSON.message);
                }
            })
    }

    _p.stopRuntime = function (runtime_id) {
        return $.ajax({
                type: 'post',
                url: g_RESTAPI_HOST_BASE+"runtimes/"+runtime_id+"/stop/",
                dataType: 'json',
                success: function (resultData, textStatus, request) {
                    if (resultData['error_msg'] == null ){
                        alert("AutoML 구동을 종료합니다.");
                    } else {
                        alert(resultData['error_msg']);
                    }
                    location.reload();
                },
                error: function (res) {
                    alert(res.responseJSON.message);
                }
            })
    }

    _p.deleteRuntime = function (runtime_id) {
        return $.ajax({
                type: 'delete',
                url: g_RESTAPI_HOST_BASE+"runtimes/"+runtime_id+"/",
                dataType: 'json',
                success: function (resultData, textStatus, request) {
                    location.reload();
                },
                error: function (res) {
                    alert(res.responseJSON.message);
                }
            })
    }



    return module;
}($FRONTEND || {}));
