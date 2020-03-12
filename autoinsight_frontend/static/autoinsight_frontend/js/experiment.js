var $FRONTEND = (function (module) {
    var _p = module._p = module._p || {};


    _p.dataset_name ="";
    var hasPending, interval
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
                                        availableMetrics
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
                                          rowCount
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
        _p.loadContainerInfo()
        _p.refreshTable()

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
            if ($(this).val() === 'sklearn') {
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
            _p.createRuntime(params.response.id)
        });

        if(hasPending){
            hasPending = false
            _p.playInterval()
        }else{
            clearInterval(interval)
        }




    };

    _p.loadContainerInfo = function (){

        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE+'info/docker_containers/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    $("#active_count").text(resultData['activeCount'])
                    $("#total_count").text(resultData['totalCount'])
                } else {
                    alert(resultData['error_msg']);
                }
            },
            error: function (res) {
                alert(res);
            }
        });
    };

    _p.playInterval = function () {

        interval = setInterval(function () { _p.refreshTable() }, 3000)
        // return false
    }
    _p.refreshTable = function () {
        $.ajax({
            type: 'post',
            url: g_RESTAPI_HOST_BASE+'graphql',
            data: JSON.stringify({query:REFRESH_RUNTIMES_QUERY}),
            contentType: "application/json",
            success: function (resultData, textStatus, request) {
                //feature 개수, target column 추가
                $('#runtime_table').bootstrapTable('load',{rows: resultData.data.runtimes})

            },
            error: function (res) {
                console.log(res);
            }
        });
    }

    _p.datasetFormatter =  function (value, row) {
        if(row.status === 'creating') {
            hasPending = true
            _p.playInterval()
            return '-'
        }else if(row.status === 'learning'){
            hasPending = true
            _p.playInterval()

        }
        return '<a  href="/preprocess/'+row.id+'/" style="color: #337ab7; text-decoration: underline;">'+value.name+'</a><br>(target : '+value.targetName+', '+value.featureNames.length+' features, '+value.rowCount+' rows)'


    }

    _p.statusFormatter =  function (value, row) {
        if(value === 'learning') {
            return value + '(' + Math.round(row.doneSlot / row.timeout * 100) + '%' +')'
        }else{
            return value
        }
    }

    _p.modelscoreFormatter =  function (value, row) {
        if(row.status === 'ready') {
            return value
        }else {
            return '<a  href="/leaderboard/'+row.id+'/" style="color: #337ab7; text-decoration: underline;">'+value+'</a>'
        }


    }

    _p.estimatorFormatter =  function (value, row) {
        var estimator_types = ['CLASSIFIER', 'REGRESSOR']
        var selectBox ='<div class="wrap_select"><select id="estimatortype_' + row.id + '" class="form-control" data-style="btn-info"'
        if(row.status === 'ready') {
            selectBox += 'onchange="$FRONTEND._p.updateRuntime(' + row.id + ')">'
        }else{
            selectBox += 'disabled>'
        }
        for (var i = 0; i < estimator_types.length; i++) {
            if (value === estimator_types[i]) {
                selectBox += '<option value="'+estimator_types[i]+'" selected>'+estimator_types[i]+'</option>'
            } else {
                selectBox += '<option value="'+estimator_types[i]+'">'+estimator_types[i]+'</option>'
            }
        }
        selectBox += '</select></div>';
        return selectBox

    }

    _p.metricFormatter =  function (value, row) {
        var available_metrics = row.availableMetrics
        value = value.toLowerCase()
        var selectBox ='<div class="wrap_select"><select id="metric_' + row.id + '" class="form-control" data-style="btn-info"'
        if(row.status === 'ready') {
            selectBox += 'onchange="$FRONTEND._p.updateRuntime(' + row.id + ')">'
        }else{
            selectBox += 'disabled>'
        }
        for (var i = 0; i < available_metrics.length; i++) {
            if (value === available_metrics[i]) {
                selectBox += '<option value="'+available_metrics[i]+'" selected>'+available_metrics[i]+'</option>'
            } else {
                selectBox += '<option value="'+available_metrics[i]+'">'+available_metrics[i]+'</option>'
            }
        }
        selectBox += '</select></div>';
        return selectBox

    }

    // _p.workerscaleFormatter =  function (value, row) {
    //     var worker_scales = [1, 2, 3, 4]
    //     var selectBox ='<div class="wrap_select"><select id="workerscale_' + row.id + '" class="form-control" data-style="btn-info"'
    //     if(row.status === 'ready') {
    //         selectBox += 'onchange="$FRONTEND._p.updateRuntime(' + row.id + ')">'
    //     }else{
    //         selectBox += 'disabled>'
    //     }
    //     for (var i = 0; i < worker_scales.length; i++) {
    //         if (value === worker_scales[i]) {
    //             selectBox += '<option value="'+worker_scales[i]+'" selected>'+worker_scales[i]+'</option>'
    //         } else {
    //             selectBox += '<option value="'+worker_scales[i]+'">'+worker_scales[i]+'</option>'
    //         }
    //     }
    //     selectBox += '</select></div>';
    //     return selectBox
    // }

    _p.actionFormatter = function(value, row){
        btnString=''//'<button class="btn_m btn_setup" type="button" data-toggle="modal" data-target="#modal-setting" onclick="$FRONTEND._p.setModal('+value+');"><span class="ico_automl ico_setup" >설정</span></button>'
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
        var active_tab = $("ul.nav-tabs li.active a")[0].getAttribute('name');
        if(active_tab==="newdata"){
            if($('#source_type').val()=="sklearn"){
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
                            _p.createRuntime(resultData.id)

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
        }else{
            source_id = $("input[name='source_id']:checked").val();
            _p.createRuntime(source_id)

        }

    };

    _p.createRuntime = function(source_id){
        return $.ajax({
            type: 'post',
            url: g_RESTAPI_HOST_BASE+"sources/"+source_id+"/experiment/",
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    $('.modal').modal('hide');
                    _p.refreshTable()
                } else {
                    alert(resultData['error_msg']);
                }
                $('.toggle-disable').prop('disabled', false)
                $('#preprocess_loader').removeClass("loader")
            },
            error: function (res) {
                console.log(res);
                $('.toggle-disable').prop('disabled', false)
                $('#preprocess_loader').removeClass("loader")
            }
        })

    }

    _p.updateRuntime = function(runtime_id){
        var data = {};
        data.workerScale = $('#workerscale_' + runtime_id).val();
        data.estimatorType = $('#estimatortype_' + runtime_id).val().toLowerCase();
        data.metric = $('#metric_' + runtime_id).val();
        console.log(JSON.stringify(data))
        return $.ajax({
            type: 'patch',
            url: g_RESTAPI_HOST_BASE+"runtimes/"+runtime_id+"/",
            dataType: 'json',
            data: data,
            success: function (resultData, textStatus, request) {
                // console.log(resultData)
                _p.refreshTable()
            },
            error: function (res) {
                alert(res.responseJSON.message);
            }
        })

    }

    _p.setModal = function(runtime_id) {
        $('#resampling_strategy').change(function() {
            if ($(this).val() === 'holdout' || $(this).val() === 'holdout-iterative-fit') {
                $('#k_folds_area').hide();
                $('#train_split_area').show();
            }else{
                $('#k_folds_area').show();
                $('#train_split_area').hide();
            }
        });

        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id,
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if(resultData.status === "ready"){
                    $('.toggle-disable').prop('disabled', false);
                }else{
                    $('.toggle-disable').prop('disabled', true);
                }
                metricCombobox ="";
                $.each(resultData['availableMetrics'], function( index, value ) {
                    if(value === resultData['metric']){
                        metricCombobox += '<option value="'+value+'" selected>'+value+'</option>';
                    }else{
                        metricCombobox += '<option value="'+value+'">'+value+'</option>';
                    }
                });
                $('#metric').html(metricCombobox);

                $('#resampling_strategy').val(resultData['resamplingStrategy']);
                if (resultData['resamplingStrategy']=== 'holdout' || resultData['resamplingStrategy'] === 'holdout-iterative-fit') {
                    $('#k_folds_area').hide();
                    $('#train_split_area').show();
                    $('#split_testdata_rate').val(resultData['resamplingStrategyHoldoutTrainSize']);
                }else{
                    $('#train_split_area').hide();
                    $('#k_folds_area').show();
                    $('#resampling_strategy_cv_folds').val(resultData['resamplingStrategyCvFolds']);
                }

                var tmp = resultData['timeout']/60;
                $('#gen_time_out').val(tmp);
                $('#runtime_id').val(resultData.id)


            },
            error: function (res) {
                alert(res.responseJSON.message);
            }
        });
    }

    _p.saveGenConf = function() {
        runtime_id = $('#runtime_id').val();
        var data = {};
        data.metric = $('#metric option:selected').val();
        data.resamplingStrategy = $('#resampling_strategy option:selected').val();
        data.resamplingStrategyHoldoutTrainSize = $('#split_testdata_rate').val();
        data.resamplingStrategyCvFolds = $('#resampling_strategy_cv_folds').val();
        data.overSampling = $('#gen_over_sampling option:selected').val();
        var timeout = $('#gen_time_out').val();
        if (timeout < 1 ||timeout > 180) {
            alert("Timeout은 1~180 사이의 값으로 입력해 주세요");
            return false;
        }
        data.timeout = timeout*60;

        return $.ajax({
            type: 'patch',
            url: g_RESTAPI_HOST_BASE + 'runtimes/'+runtime_id +'/',
            data: JSON.stringify(data),
            dataType: 'json',
            success: function (resultData, textStatus, request) {

                _p.refreshTable()
            },
            contentType: 'application/json',
            error: function (res) {
                alert(res.responseJSON.message);
            }
        })
    };

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
                _p.refreshTable()
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
                _p.refreshTable()
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
                _p.refreshTable()
            },
            error: function (res) {
                alert(res.responseJSON.message);
            }
        })
    }

    _p.sourceIdFormatter =  function (value, row) {
        return '<input type="radio" name="source_id" value="'+value+'">'
    }





    return module;
}($FRONTEND || {}));
