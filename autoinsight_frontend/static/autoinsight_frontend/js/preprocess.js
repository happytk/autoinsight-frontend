var $FRONTEND = (function (module) {
    var _p = module._p = module._p || {};

    var targetColumn, isFirst, estimator_type, showOutlier, showPowerTrans, distributions, curStep, maxStep, datasetId;
    //초기화면 세팅
    _p.init = function(){
        _p.loadPipeline()

        isFirst = true


        $('#column_table').on('load-success.bs.table', function (data, jqXHR) {
            // targetColumn={};
            if(jqXHR.length<20){
                $('.dist_buttons').hide()
                $('canvas').show()
                $(jqXHR).each(function(index, column) {
                    _p.drawDistribution(column.id, column.freqIdxJson, column.freqJson);
                    if(column.isTarget){
                        $('#feature_'+column['id']).attr("disabled", true);
                        // if(isFirst === true){
                        //     if(column.taskType === 'multiclass' || column.taskType === 'binary'){
                        //         $estimator_type = "classifier"
                        //         $('#metric').val('accuracy');
                        //     }else{
                        //         estimator_type = "classifier"
                        //         $('#metric').val('r2');
                        //     }
                        //     if(status === 'ready') _p.updateEstimatorType(estimator_type, false);
                        //     isFirst = false
                        // }
                        // targetColumn.id = column.id;
                        // targetColumn.name = column.name;
                    }
                });

            }else{
                $('canvas').hide()
                $('.dist_buttons').show()
                distributions={};
                $(jqXHR).each(function(index, column) {
                    distributions[column.id]  = [column.freqIdxJson, column.freqJson]
                    if(column.isTarget){
                        _p.drawDistribution(column.id);
                        $('#feature_'+column['id']).attr("disabled", true);
                        // if(isFirst === true){
                        //     if(column.taskType === 'multiclass' || column.taskType === 'binary'){
                        //         estimator_type = "classifier"
                        //         $('#metric').val('accuracy');
                        //     }else{
                        //         estimator_type = "regressor"
                        //         $('#metric').val('r2');
                        //     }
                        //     if(status === 'ready') _p.updateEstimatorType(estimator_type, false);
                        //     isFirst = false
                        // }
                        // targetColumn.id = column.id;
                        // targetColumn.name = column.name;
                    }
                });

            }

            if(curStep <maxStep){
                $('.toggle-disable').prop('disabled', true)
                $('.gen-conf').prop('disabled', true)
                $('.pre-conf').prop('disabled', true)
            }else{
                $('.toggle-disable').prop('disabled', false)
                $('.gen-conf').prop('disabled', false)
                $('.pre-conf').prop('disabled', false)
            }

            $('#preprocess_loader').removeClass("loader")

        });

        // $('#estimator_type').change(function() {
        //     _p.updateEstimatorType();
        // });


        $('#modal-setting').on('shown.bs.modal', function (e) {
            // $('.gen-conf').change(function() {
            //     _p.saveGenConf()
            // });
            $('.pre-conf').change(function() {
                _p.savePreConf()
            });
            // $('#gen_max_eval_time').change(function() {
            //     var max_eval_time = $(this).val()
            //     var tmp = Math.floor($('#gen_time_out').val()/10)
            //
            //     if (max_eval_time < 1 ||max_eval_time > tmp) {
            //         alert("Max Evaluation Time은 최소 1에서 최대 "+tmp+"사이의 값으로 입력해 주세요");
            //         $(this).val(tmp)
            //         return false;
            //     }
            //     _p.saveGenConf()
            // });
            //
            // $('#resampling_strategy').change(function() {
            //     if ($(this).val() === 'holdout') {
            //         $('#k_folds_area').hide();
            //         $('#train_split_area').show();
            //     }else{
            //         $('#k_folds_area').show();
            //         $('#train_split_area').hide();
            //     }
            // });


            // $('#pre_Ocolumn').multiselect(
            //     {
            //         includeSelectAllOption: true,
            //         numberDisplayed: 1,
            //         onChange: function($option) {
            //             // Check if the filter was used.
            //             var query = $('#pre_Ocolumn li.multiselect-filter input').val();
            //             if (query) {
            //                 $('#pre_Ocolumn li.multiselect-filter input').val('').trigger('keydown');
            //             }
            //         }
            //     }
            // );

            $('#pre_Omethod').change(function() {
                if ($(this).val() === 'BOX_PLOT_RULE') {
                    $('#pre_Othreshold_all').hide();
                }else{
                    $('#pre_Othreshold_all').show();
                }
            });
            // _p.loadGenConf()
            return false


        });

        $("#modal-setting").on('hide.bs.modal', function(){
            $('#column_table').bootstrapTable('refresh')
        });

    };



    // _p.loadStatus = function (){
    //     status =""
    //     $.ajax({
    //         type: 'get',
    //         url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id + '/',
    //         dataType: 'json',
    //         success: function (resultData, textStatus, request) {
    //             //화면 세팅
    //             status = resultData.status
    //             if(status === "ready"){
    //                 $('#loader').removeClass("loader");
    //                 $('#runButton').prop('disabled', false);
    //                 $('.toggle-disable').prop('disabled', false);
    //                 $('.gen-conf').prop('disabled', false);
    //                 $('.pre-conf').prop('disabled', false);
    //
    //             }else{
    //                 if(resultData.status === "learning") $('#leaderboard_loader').addClass("loader");
    //                 $('#runButton').prop('disabled', true);
    //                 $('.toggle-disable').prop('disabled', true);
    //                 $('.gen-conf').prop('disabled', true);
    //                 $('.pre-conf').prop('disabled', true);
    //
    //             }
    //         },
    //         error: function (res) {
    //             alert(res.responseJSON.message);
    //         }
    //     });
    //     return status
    // };

    _p.loadDatasetInfo = function(dataset_id){
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE+'datasets/{0}/'.format(dataset_id), //'runtimes/'+runtime_id+'/dataset/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    $("#dataset_name").text(resultData['name'].split(".")[0]);
                    $("#row_count").text(resultData['rowCount']);
                    $("#col_count").text(resultData['colCount']);
                } else {
                    alert(resultData['error_msg']);
                }
            },
            error: function (res) {
                console.log(res);
            }
        });
    }

    _p.clearAll = function(){
        try {
            $.ajax({
                type: 'delete',
                url: g_RESTAPI_HOST_BASE + 'source/',
                dataType: 'json'
            })
        }
        catch (e) {
            console.log(e);
        }
        try {
            $.ajax({
                type: 'delete',
                url: g_RESTAPI_HOST_BASE + 'runtime/',
                dataType: 'json'
            })
        }
        catch (e) {
            console.log(e);
        }
        try {
            $.ajax({
                type: 'delete',
                url: g_RESTAPI_HOST_BASE + 'deployment/',
                dataType: 'json'
            })
        }
        catch (e) {
            console.log(e);

        }
        return location.reload();


    };

    //Pipeline 관련
    _p.loadPipeline = function(){
        $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id+'/datasets_preprocessed/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    var pipelinehtml =""
                    var step
                    maxStep =0
                    $.each(resultData, function( index, value ) {
                        step = index*2
                        if(index<resultData.length-1){
                            pipelinehtml += '<li id="step_' + step + '" class="nav-item pipeline preview" onclick="$FRONTEND._p.changePoint('+step+'); $FRONTEND._p.loadPreviewArea('+value.id+')"><a class="nav-link"><span class="ico_automl ico_table">결과</span></a></li>'
                            step += 1
                            pipelinehtml += '<li id="step_' + step + '" class="nav-item pipeline" onclick="$FRONTEND._p.changePoint('+step+'); $FRONTEND._p.loadColumnArea('+value.id+')"><a class="nav-link"><span class="ico_automl ico_set">preprocess</span><span class="ico_automl ico_del" onclick="$FRONTEND._p.deletePreprocess('+value.id+');">삭제</span></a></li>'
                        }else{
                            if(value.processingStatus==="REQUEST" || value.processingStatus==="STARTED" || value.processingStatus==="FINISHED"){
                                $('#preprocess_loader').addClass("loader")
                                $('#runButton').prop('disabled', true);
                                $('#runButton').html('Preprocessing')
                                pipelinehtml += '<li class="nav-item"><a class="nav-link"><span class="ico_automl ico_table">결과</span><span class="ico_automl ico_on">선택됨</span></a></li>'
                                pipelinehtml += '<li class="nav-item"><a class="nav-link active"><span class="ico_automl ico_set">preprocess</span><span class="ico_automl ico_del">삭제</span></a></li>'
                                pipelinehtml += '<li class="nav-item pipeline preview"><a class="nav-link"><div class="loader"></div></a></li>'
                                setTimeout(function(){
                                    _p.loadPipeline()
                                    return false
                                }, 1000)
                                return false
                            }else{
                                $('#preprocess_loader').removeClass("loader")
                                $('#runButton').prop('disabled', false);
                                $('#runButton').addClass('btn_run');
                                $('#runButton').html('Run AutoML <span class="ico_automl ico_arr"></span>')
                                pipelinehtml += '<li id="step_' + step + '" class="nav-item pipeline preview item_point" onclick="$FRONTEND._p.changePoint('+step+'); $FRONTEND._p.loadPreviewArea('+value.id+')"><a class="nav-link"><span class="ico_automl ico_table">결과</span><span class="ico_automl ico_on">선택됨</span></a></li>'
                                step += 1
                                maxStep = step
                                pipelinehtml += '<li class="nav-item item_add" ><a class="nav-link active"><span class="ico_automl ico_add" onclick="$FRONTEND._p.addElement('+value.id+')">추가</span></a></li>'
                                _p.loadPreviewArea(value.id)
                            }

                        }

                    })

                    $('#pipeline').html(pipelinehtml)
                    return false
                } else {
                    alert(resultData['error_msg']);
                }
            },
            error: function (res) {
                console.log(res);
            }
        });

    }
    _p.addElement = function (id) {
        $('.item_point').removeClass('item_point')
        if($('.pipeline:last').hasClass( 'preview' )){
            $('<li class="nav-item pipeline item_point"><a id="step_' + maxStep + '" class="nav-link" onclick="$FRONTEND._p.changePoint(' + maxStep + '); $FRONTEND._p.loadColumnArea('+id+')"><span class="ico_automl ico_set">preprocess</span><span class="ico_automl ico_del" onclick="$FRONTEND._p.deletePreprocess('+id+');">삭제</span></a></li>').insertAfter( ".pipeline:last")
            _p.loadColumnArea(id)

        }else{
            _p.preprocess().done(function() {
                _p.loadPreviewArea(id)
            })

        }
    }

    _p.changePoint = function (step) {
        $('.item_point').removeClass('item_point')
        $('#step_'+step).addClass('item_point')
        curStep = step
    };

    //Preview 관련
    _p.loadPreviewArea = function (dataset_id) {
        datasetId = dataset_id
        $('#column_area').hide()
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE+'datasets/'+datasetId+'/preview_source/',
            contentType: "application/json",
            success: function (resultData, textStatus, request) {
                _p.loadDatasetInfo(datasetId)
                $('#preview_table').bootstrapTable('destroy')
                var columns =[]
                $.each(resultData[0], function(key, value){
                    columns.push({
                        title: key,
                        field: key
                    })
                });
                $('#preview_table').bootstrapTable({
                    columns: columns
                })

                $('#preview_table').bootstrapTable('load',{rows: resultData})
                $('#preview_area').show()

            },
            error: function (res) {
                console.log(res);
            }
        });
    }



    //Preprocess 관련

    _p.loadColumnArea = function (dataset_id) {
        datasetId = dataset_id
        _p.loadPreConf().done(function() {
            var columns = [{
                class: 'txt_l',
                field: 'name',
                title: 'Name'
            }, {
                field: 'datatype',
                title: 'Datatype',
                formatter: '$FRONTEND._p.datatypeFormatter'
            }, {
                field: 'missing',
                title: 'Missing'
            }, {
                field: 'imputation',
                title: 'Imputation',
                formatter: '$FRONTEND._p.imputationFormatter'
            }, {
                field: 'transformationStrategy',
                title: 'Power<br>Transformation',
                formatter: '$FRONTEND._p.powerTransFormatter',
                visible: showPowerTrans
            }, {
                field: 'useOutlier',
                title: 'Outlier<br>Elimination',
                formatter: '$FRONTEND._p.outlierEliFormatter',
                visible: showOutlier
            }, {
                field: 'unique',
                title: 'Unique'
            }, {
                field: 'mean',
                title: 'Mean'
            }, {
                field: 'min',
                title: 'Min'
            }, {
                field: 'max',
                title: 'Max'
            }, {
                field: 'id',
                title: 'Distribution',
                formatter: '$FRONTEND._p.distributionFormatter'
            }, {
                field: 'isFeature',
                title: 'Features',
                formatter: '$FRONTEND._p.featureFormatter'
            }, {
                field: 'isTarget',
                title: 'Target',
                formatter: '$FRONTEND._p.targetFormatter',
            }, {
                field: 'taskType',
                title: 'Task Type',
                visible: false
            }]
            $('#preview_area').hide()
            $('#column_table').bootstrapTable('destroy')
            $('#column_table').bootstrapTable({
                url:  g_RESTAPI_HOST_BASE+'datasets/'+datasetId+'/columns/',
                columns: columns
            })

            var max_width = 1280
            if(showPowerTrans) max_width += 150
            if(showOutlier) max_width += 150
            $('main > .container').css("max-width", max_width);

            $('#column_area').show()
        })


    }

    _p.deletePreprocess = function(dataset_id){
        return $.ajax({
            type: 'delete',
            url: g_RESTAPI_HOST_BASE + 'datasets/'+dataset_id+'/',
            dataType: 'json',
            contentType: 'application/json',
            success: function (resultData, textStatus, request) {
                _p.loadPipeline()
            },
            error: function (res) {
                alert(res.responseJSON.message);
            }
        })
    }



    _p.datatypeFormatter = function(value, row){
        var datatypes = ['object','int64','float64','datetime64'];
        var selectBox = '<div class="wrap_select"><select id="datatype_'+row.id+'" class="form-control toggle-disable" data-style="btn-info" onchange="$FRONTEND._p.updateColumn('+row.id+')">';
        for(var i = 0; i < datatypes.length; i++){
            if (value == datatypes[i]){
                selectBox += '<option value="'+datatypes[i]+'" selected>'+datatypes[i]+'</option>';
            } else {
                selectBox += '<option value="'+datatypes[i]+'">'+datatypes[i]+'</option>';
            }
        }
        selectBox += '</select></div>';
        return selectBox;
    };

    _p.imputationFormatter = function(value, row) {
        var obj_imputations = ['NONE', 'DROP', 'MOST_FREQUENT', 'UNKNOWN'];
        var num_imputations = ['NONE', 'DROP', 'MOST_FREQUENT', 'MEAN', 'MEDIAN', '0', 'MINIMUM'];
        if(row.missing==0){

            return '<div class="wrap_select"><select id="imputation_' + row.id + '" class="form-control" data-style="btn-info" disabled><option value="NONE">None</option></select></div>'
        }
        var selectBox = '<div class="wrap_select"><select id="imputation_' + row.id + '" class="form-control toggle-disable" data-style="btn-info" onchange="$FRONTEND._p.updateColumn('+row.id+')">';
        if (row.datatype == "object"){
            for (var i = 0; i < obj_imputations.length; i++) {
                if (value == obj_imputations[i]) {
                    selectBox += '<option value="'+obj_imputations[i]+'" selected>'+obj_imputations[i]+'</option>';
                } else {
                    selectBox += '<option value="'+obj_imputations[i]+'">'+obj_imputations[i]+'</option>';
                }
            }
        }else{
            for (var i = 0; i < num_imputations.length; i++) {
                if (value == num_imputations[i]) {
                    selectBox += '<option value="'+num_imputations[i]+'" selected>'+num_imputations[i]+'</option>';
                } else {
                    selectBox += '<option value="'+num_imputations[i]+'">'+num_imputations[i]+'</option>';
                }
            }

        }
        selectBox += '</select></div>';
        return selectBox;
    };

    _p.powerTransFormatter = function(value, row){
        if(showPowerTrans) {
            var strategies = ['NONE', 'LOG', 'SQUARED_ROOT', 'SQUARE', 'BOX_COX_TRANSFORMATION', 'YEO_JOHNSON_TRANSFORMATION'];
            var selectBox = '<div class="wrap_select"><select id="powertrans_' + row.id + '" class="form-control toggle-disable" data-style="btn-info" onchange="$FRONTEND._p.updateColumn(' + row.id + ')">';
            for (var i = 0; i < strategies.length; i++) {
                if (value == strategies[i]) {
                    selectBox += '<option value="' + strategies[i] + '" selected>' + strategies[i] + '</option>';
                } else {
                    selectBox += '<option value="' + strategies[i] + '">' + strategies[i] + '</option>';
                }
            }
            selectBox += '</select></div>';
            return selectBox;
        }else{
            return null
        }
    };

    _p.outlierEliFormatter = function(value,row){
        if(showOutlier){
            var str = "";
            if (value == true) {
                str = '<div class="wrap_check type_check2 on"><input type="checkbox" id="outlier_'+row.id+'" class="inp_check features toggle-disable" onclick="$FRONTEND._p.updateColumn('+row.id+')" checked><label for="outlier_'+row.id+'" class="label_check"><span class="ico_automl ico_check">sepal.lenght Features</span></label></div>'
            }else{
                str = '<div class="wrap_check type_check2"><input type="checkbox" id="outlier_'+row.id+'" class="inp_check features toggle-disable" onclick="$FRONTEND._p.updateColumn('+row.id+')" ><label for="outlier_'+row.id+'" class="label_check"><span class="ico_automl ico_check">sepal.lenght Features</span></label></div>'
            }
            return str;
        }else{
            return null
        }

    };

    _p.featureFormatter = function(value,row){
        var str = "";
        if (value == true) {
            str = '<div class="wrap_check type_check2 on"><input type="checkbox" id="feature_'+row.id+'" colum_name="'+row.name+'" class="inp_check features toggle-disable" onclick="$FRONTEND._p.updateColumn('+row.id+')" checked><label for="feature_'+row.id+'" class="label_check"><span class="ico_automl ico_check">sepal.lenght Features</span></label></div>'
        }else{
            str = '<div class="wrap_check type_check2"><input type="checkbox" id="feature_'+row.id+'" colum_name="'+row.name+'" class="inp_check features toggle-disable" onclick="$FRONTEND._p.updateColumn('+row.id+')" ><label for="feature_'+row.id+'" class="label_check"><span class="ico_automl ico_check">sepal.lenght Features</span></label></div>'
        }
        return str;
    };

    _p.targetFormatter = function(value,row){
        var str = "";
        if (value == true) {
            str = '<div class="wrap_check check_target on"><input type="radio" id="target_'+row.id+'" name="target" colum_name="'+row.name+'" class="inp_check toggle-disable" checked><label for="target_'+row.id+'" class="label_check"><span class="ico_automl ico_check">sepal.lenght Features</span></label></div>'
        }
        // else{
        //     str = '<div class="wrap_check check_target"><input type="radio" id="target_'+row.id+'" name="target" colum_name="'+row.name+'" class="inp_check toggle-disable" onclick="$FRONTEND._p.updateTarget('+row.id+')"><label for="target_'+row.id+'" class="label_check"><span class="ico_automl ico_check">sepal.lenght Features</span></label></div>'
        // }
        return str;
    };

    // _p.showOptColumns = function(){
    //     if(showOutlier) {
    //         $('#column_table').bootstrapTable('showColumn', 'useOutlier')
    //         //$('#outlier_col').css("width", "150px")
    //     }else{
    //         $('#column_table').bootstrapTable('hideColumn', 'useOutlier')
    //         //$('#outlier_col').css("width", "0px")
    //     }
    //     if(showPowerTrans){
    //         $('#column_table').bootstrapTable('showColumn', 'transformationStrategy')
    //         //$('#powerTrans_col').css("width", "150px")
    //     } else{
    //         $('#column_table').bootstrapTable('hideColumn', 'transformationStrategy')
    //         //$('#powerTrans_col').css("width", "0px")
    //     }
    //
    //     if (showOutlier && showPowerTrans) {
    //         $('main > .container').css("max-width", "1580px");//1280+150*2
    //     }
    //     else if (showOutlier || showPowerTrans) {
    //         $('main > .container').css("max-width", "1430px"); //1280+150
    //     }
    //     else {
    //         $('main > .container').css("max-width", "1280px");
    //     }
    //     $('#column_table').bootstrapTable('refresh')
    // }

    _p.updateColumn = function(rowid) {
        var data = {};
        data.datatype = $('#datatype_' + rowid).val();
        data.imputation = $('#imputation_' + rowid).val();
        data.transformationStrategy = $('#powertrans_' + rowid).val();
        data.useOutlier = $('#outlier_' + rowid).is(":checked");
        data.isFeature = $('#feature_' + rowid).is(":checked");
        return $.ajax({
            type: 'patch',
            url: g_RESTAPI_HOST_BASE + 'datasets/{0}/columns/{1}/'.format(datasetId, rowid),//runtimes/'+runtime_id+'/dataset_preprocessed/columns/{0}/'.format(rowid),
            data: data,
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null) {
                    // $('#column_table').bootstrapTable('refresh',{silent: true});
                } else {
                    alert(resultData['error_msg']);
                }
            },
            error: function (res) {
                console.log(res);
            }
        })
    };

    // _p.updateTarget = function(rowid){
    //     if(curStep > 1){
    //         alert("Once selected, you cannot change the target.")
    //         $('#column_table').bootstrapTable('refresh')
    //         return false
    //     }
    //     var data ={};
    //     data.isTarget = false;
    //     return $.ajax({
    //         type: 'patch',
    //         url: g_RESTAPI_HOST_BASE + 'datasets/{0}/columns/{1}/'.format(datasetId, rowid),//'runtimes/'+runtime_id + '/dataset_preprocessed/columns/{0}/'.format(targetColumn.id),
    //         data: data,
    //         dataType: 'json',
    //         success: function (resultData, textStatus, request) {
    //             if (resultData['error_msg'] == null ){
    //                 var data ={};
    //                 $('.features').removeAttr("disabled");
    //                 $('#feature_'+rowid).attr("disabled", true);
    //                 data.isFeature = false;
    //                 data.isTarget = true;
    //                 $.ajax({
    //                     type: 'patch',
    //                     url: g_RESTAPI_HOST_BASE + 'datasets/{0}/columns/{1}/'.format(datasetId, rowid),//'runtimes/'+runtime_id + '/dataset_preprocessed/columns/{0}/'.format(rowid),
    //                     data: data,
    //                     dataType: 'json',
    //                     success: function (resultData, textStatus, request) {
    //                         if (resultData['error_msg'] == null ){
    //                             targetColumn.id = resultData.id;
    //                             targetColumn.name = resultData.name;
    //                             if(resultData.taskType === 'multiclass' || resultData.taskType === 'binary'){
    //                                 estimator_type = "classifier"
    //                             }else{
    //                                 estimator_type = "regressor"
    //                             }
    //                             _p.updateEstimatorType(estimator_type, false);
    //                             $('#feature_'+rowid).prop("checked", false);
    //                             $('#feature_'+rowid).attr("disabled", true);
    //                         } else {
    //                             alert(resultData['error_msg']);
    //                         }
    //                     },
    //                     error: function (res) {
    //                         alert(res.responseJSON.message);
    //                     }
    //                 })
    //             } else {
    //                 alert(resultData['error_msg']);
    //             }
    //         },
    //         error: function (res) {
    //             alert(res.responseJSON.message);
    //         }
    //     })
    // };

    _p.distributionFormatter = function(value,row){
        return '<button class="btn_s btn_border dist_buttons" id="dist_button_'+value+'" data-toggle="modal" data-target="#modal-metric" onclick="$FRONTEND._p.drawDistribution('+value+')" type="button" >View</button><canvas id="distribution_'+row.id+'"></canvas>'
    };


    _p.drawDistribution = function(id, label=null, data=null) {

        $('#dist_button_'+id).hide()
        if(label === null && data === null){
            label = distributions[id][0]
            data = distributions[id][1]
        }
        try {
            label = JSON.parse(label);
            data = JSON.parse(data);
        }
        catch(err) {
            return false
        }

        new Chart($('#distribution_'+id),{
            type: 'bar',
            data: {
                labels: label,//['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
                datasets: [{
                    label: '',
                    backgroundColor: 'rgb(167, 89, 190)',
                    barThickness: 1,
                    data: data
                }]
            },
            options: {
                legend: {
                    display:false
                },
                title:{
                    display:false
                },
                tooltips:{
                    enabled:false
                },
                scales:{
                    yAxes: [{
                        gridLines:{
                            display:false,
                            drawBorder: false
                        },
                        ticks: {
                            display:false,
                            beginAtZero: true
                        }

                    }],
                    xAxes: [{
                        gridLines:{
                            display:false,
                            drawBorder: false
                        },
                        ticks:{
                            display:false
                        }
                    }]
                }
            }
        });
        $('#distribution_'+id).show()
    };

    _p.drawCorrelation=function(corr){
        Highcharts.chart('container', {

            chart: {
                type: 'heatmap',
                marginTop: 40,
                marginBottom: 80,
                marginRight: 110
            },

            title: {
                text: null
            },

            exporting: {
                enabled: false
            },

            xAxis: {
                lineWidth: 0,
                categories: corr.x,//['Alexander', 'Marie', 'Maximilian', 'Sophia', 'Lukas', 'Maria', 'Leon', 'Anna', 'Tim', 'Laura']
            },

            yAxis: {
                lineWidth: 0,
                categories: corr.y,//['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                title: null,
                reversed: true
            },

            colorAxis: {
                stops: [
                    [0, '#2756E3'], // 최저값 컬러
                    [0.5, '#fff'], // 가운데값 컬러
                    [1,'#ec2b2d'] // 최고값 컬러
                ],
                min: -1,
                reversed: false
            },

            legend: {
                align: 'right',
                layout: 'vertical',
                margin: 0,
                verticalAlign: 'top',
                y: 23, // legend Y position
                symbolHeight: 280,

            },

            tooltip: {
                formatter: function () {
                    return '<b>' + this.series.xAxis.categories[this.point.x] + '</b><br><b>' +
                        this.point.value + '</b><br><b>' + this.series.yAxis.categories[this.point.y] + '</b>';
                }
            },

            series: [{
                borderWidth: 0,
                data: corr.data,
                dataLabels: {
                    enabled: false
                }
            }]

        });
    };

    //Modal 관련
    _p.setCorrModal = function(){
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE+ 'datasets/{0}/stat_corr/'.format(datasetId),//'runtimes/'+runtime_id+'/dataset/stat_corr/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    try {
                        var corr = JSON.parse(resultData['corrJson'] );
                        corr.data =[];
                        for(var i = 0; i < corr.z.length; i++) {
                            for(var j = 0; j < corr.z[i].length; j++) {
                                corr.data.push([i,j,corr.z[i][j]]);
                            }
                        }
                        _p.drawCorrelation(corr);
                    }
                    catch(err) {
                        console.log(err)
                        $('#container').text("죄송합니다. 이 정보를 불러올 수 없습니다.")
                    }
                } else {
                    alert(resultData['error_msg']);
                }
            },
            error: function (res) {
                alert(res.responseJSON.message);
            }
        });

    }



    _p.reset = function(){
        // $('#gen_over_sampling').val("None");
        // $('#gen_time_out').val(60);
        $('.modal_check:checkbox:checked').prop( "checked", false );
        // $('#na_col_drop_threshold').val(0.9);
        // $('#pre_Ocolumn').multiselect('destroy');
        $('#pre_Omethod').val("Z_SCORE");
        $('#pre_Othreshold_all').show();
        $('#pre_Othreshold').val(3);
        // $('#pre_Pstrategy_0').val("YeoJohnsonTransformation");
        $('#pre_Sstrategy').val("Standard");

    };

    _p.loadPreConf = function() {
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE + 'datasets/{0}/'.format(datasetId),//'runtimes/'+runtime_id + '/dataset/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    //Modal 세팅
                    _p.reset();
                    // if(resultData['naColDropUse']){
                    //     $('#pre_DrpNCols').prop( "checked", true );
                    //     $('#na_col_drop_threshold').val(resultData['naColDropThreshold']);
                    // }

                    if(resultData['outlierUse']){
                        $('#pre_OtlrElmntn').prop( "checked", true );
                        $('#pre_Omethod').val(resultData['outlierStrategy']);
                        $('#pre_Othreshold').val(resultData['outlierThreshold']);
                        showOutlier = true
                    }else{
                        $('#pre_OtlrElmntn').prop( "checked", false );
                        showOutlier = false
                    }

                    if(resultData['colTransUse']){
                        $('#pre_PrTrnsfrm').prop( "checked", true );
                        showPowerTrans = true
                    }else{
                        $('#pre_PrTrnsfrm').prop( "checked", false );
                        showPowerTrans = false
                    }




                } else {
                    alert(resultData['error_msg']);
                }
            },
            error: function (res) {
                console.log(res)
            }
        });
    }

    // _p.loadGenConf = function() {
    //     return $.ajax({
    //         type: 'get',
    //         url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id,
    //         dataType: 'json',
    //         success: function (resultData, textStatus, request) {
    //             metricCombobox ="";
    //             $.each(resultData['availableMetrics'], function( index, value ) {
    //                 if(value === resultData['metric']){
    //                     metricCombobox += '<option value="'+value+'" selected>'+value+'</option>';
    //                 }else{
    //                     metricCombobox += '<option value="'+value+'">'+value+'</option>';
    //                 }
    //             });
    //             $('#metric').html(metricCombobox);
    //
    //             $('#resampling_strategy').val(resultData['resamplingStrategy']);
    //             if (resultData['resamplingStrategy']=== 'holdout') {
    //                 $('#k_folds_area').hide();
    //                 $('#train_split_area').show();
    //                 $('#split_testdata_rate').val(resultData['resamplingStrategyHoldoutTrainSize']);
    //             }else{
    //                 $('#train_split_area').hide();
    //                 $('#k_folds_area').show();
    //                 $('#resampling_strategy_cv_folds').val(resultData['resamplingStrategyCvFolds']);
    //             }
    //
    //             var tmp = resultData['timeout']/60;
    //             $('#gen_time_out').val(tmp);
    //
    //
    //             tmp = resultData['maxEvalTime']/60;
    //             $('#gen_max_eval_time').val(tmp);
    //
    //             if(resultData['useAutosklearn']){
    //                 $('#autosklearn').prop( "checked", true );
    //             }
    //
    //             if(resultData['useTpot']){
    //                 $('#tpot').prop( "checked", true );
    //             }
    //             if(resultData['useEnsemble']){
    //                 $('#ensemble').prop( "checked", true );
    //             }
    //
    //             if(resultData['includeOneHotEncoding']){
    //                 $('#pre_1HotEncod').prop( "checked", true );
    //             }
    //
    //             if(resultData['includeVarianceThreshold']){
    //                 $('#pre_VarThreshold').prop( "checked", true );
    //             }
    //
    //
    //             smethodCombobox ="";
    //             $.each(resultData['availableScalingMethods'], function( index, value ) {
    //                 smethodCombobox += '<option value="'+value+'">'+value+'</option>';
    //             });
    //
    //             $('#pre_SMethod').html(smethodCombobox);
    //
    //             $('#pre_SMethod').multiselect(
    //                 {
    //                     includeSelectAllOption: true,
    //                     numberDisplayed: 1,
    //                     onChange: function($option) {
    //                         // Check if the filter was used.
    //                         var query = $('#pre_SMethod li.multiselect-filter input').val();
    //                         if (query) {
    //                             $('#pre_SMethod li.multiselect-filter input').val('').trigger('keydown');
    //                         }
    //                     }
    //                 }
    //             );
    //             if(resultData['includeScalingMethods'] !== null) {
    //                 $('#pre_Scaling').prop( "checked", true )
    //                 $('#pre_SMethod').multiselect('select', resultData['includeScalingMethods']);
    //                 $('#pre_SMethod').multiselect('refresh');
    //             }
    //
    //             fmethodCombobox ="";
    //             $.each(resultData['availableFeatureEngineerings'], function( index, value ) {
    //                 if(value === resultData['availableFeatureEngineerings']){
    //                     fmethodCombobox += '<option value="'+value+'" selected>'+value+'</option>';
    //                 }else{
    //                     fmethodCombobox += '<option value="'+value+'">'+value+'</option>';
    //                 }
    //             });
    //             $('#pre_FMethod').html(fmethodCombobox);
    //
    //             $('#pre_FMethod').multiselect(
    //                 {
    //                     includeSelectAllOption: true,
    //                     numberDisplayed: 1,
    //                     onChange: function($option) {
    //                         // Check if the filter was used.
    //                         var query = $('#pre_FMethod li.multiselect-filter input').val();
    //                         if (query) {
    //                             $('#pre_FMethod li.multiselect-filter input').val('').trigger('keydown');
    //                         }
    //                     }
    //                 }
    //             );
    //
    //             if(resultData['includeFeatureEngineerings'] !== null) {
    //                 $('#pre_FtrSlcon').prop( "checked", true )
    //                 $('#pre_FMethod').multiselect('select', resultData['includeFeatureEngineerings']);
    //                 $('#pre_FMethod').multiselect('refresh');
    //             }
    //
    //             var estimatorHtml = ""
    //             $.each(resultData['availableEstimators'], function( index, value ) {
    //                 estimatorHtml +='<div class="wrap_check">'
    //                 if($.inArray(value, resultData['includeEstimators'] ) !== -1){
    //                     estimatorHtml += '<input type="checkbox" name="'+value+'" id="'+value+'" class="inp_check modal_check estimators" onchange="$FRONTEND._p.saveGenConf()" checked>'
    //                 }else{
    //                     estimatorHtml += '<input type="checkbox" name="'+value+'" id="'+value+'" class="inp_check modal_check estimators" onchange="$FRONTEND._p.saveGenConf()">'
    //                 }
    //                 estimatorHtml += '<label for="'+value+'" class="label_check"><span class="ico_automl ico_check"></span>'+value+'</label></div><br>'
    //             });
    //             $('#available_estimators').html(estimatorHtml)
    //
    //
    //         },
    //         error: function (res) {
    //             alert(res.responseJSON.message);
    //         }
    //     });
    // }

    _p.autoConf = function(){
        return $.ajax({
            type: 'post',
            url: g_RESTAPI_HOST_BASE + 'datasets/{0}/recommend_config/'.format(datasetId), //+ 'runtimes/'+runtime_id +'/dataset/recommend_config/',
            dataType: 'json',
            contentType: 'application/json',
            success: function (resultData, textStatus, request) {
                _p.loadPreConf()
                // _p.loadGenConf()
                $('#column_table').bootstrapTable('refresh',{silent: true})
            },
            error: function (res) {
                alert(res.responseText);
            }
        })

    };


    // _p.saveGenConf = function() {
    //     var data = {};
    //     data.metric = $('#metric option:selected').val();
    //     data.resamplingStrategy = $('#resampling_strategy option:selected').val();
    //     data.resamplingStrategyHoldoutTrainSize = $('#split_testdata_rate').val();
    //     data.resamplingStrategyCvFolds = $('#resampling_strategy_cv_folds').val();
    //     data.overSampling = $('#gen_over_sampling option:selected').val();
    //
    //     var timeout = $('#gen_time_out').val();
    //     if (timeout < 1 ||timeout > 180) {
    //         alert("Timeout은 1~180 사이의 값으로 입력해 주세요");
    //         return false;
    //     }
    //     data.timeout = timeout*60;
    //
    //     var max_eval_time = $('#gen_max_eval_time').val();
    //     data.maxEvalTime = max_eval_time*60;
    //
    //     if  ($('#autosklearn').is(':checked')) {
    //         data.useAutosklearn = true;
    //     }else{
    //         data.useAutosklearn = false;
    //     }
    //
    //     if  ($('#tpot').is(':checked')) {
    //         data.useTpot = true;
    //     }else{
    //         data.useTpot = false;
    //     }
    //
    //     if  ($('#ensemble').is(':checked')) {
    //         data.useEnsemble = true;
    //     }else{
    //         data.useEnsemble = false;
    //     }
    //
    //     if  ($('#pre_1HotEncod').is(':checked')) {
    //         data.includeOneHotEncoding = true;
    //     }else{
    //         data.includeOneHotEncoding = false;
    //     }
    //
    //     if  ($('#pre_VarThreshold').is(':checked')) {
    //         data.includeVarianceThreshold = true;
    //     }else{
    //         data.includeVarianceThreshold = false;
    //     }
    //
    //     if  ($('#pre_Scaling').is(':checked')) {
    //
    //         data.includeScalingMethodsJson = JSON.stringify($('select[id=pre_SMethod]').val());
    //     }
    //
    //     if  ($('#pre_FtrSlcon').is(':checked')) {
    //
    //         data.includeFeatureEngineeringsJson = JSON.stringify($('select[id=pre_FMethod]').val());
    //     }
    //
    //     var include_estimators = []
    //     $(".estimators").each(function () {
    //         if($(this).is(":checked")) include_estimators.push($(this)[0].name)
    //     });
    //     data.includeEstimatorsJson = JSON.stringify(include_estimators)
    //
    //     return $.ajax({
    //         type: 'patch',
    //         url: g_RESTAPI_HOST_BASE + 'runtimes/'+runtime_id +'/',
    //         data: JSON.stringify(data),
    //         dataType: 'json',
    //         contentType: 'application/json',
    //         success: function (resultData, textStatus, request) {
    //
    //         },
    //         error: function (res) {
    //             console.log(res)
    //         }
    //     })
    // };

    _p.savePreConf = function(){
        var data = {};

        //-------------------------- 1. Drop NaN Columns --------------------------
        // if  ($('#pre_DrpNCols').is(':checked')) {
        //     data.naColDropUse = true;
        //     if  ($('#na_col_drop_threshold').val()!="") {
        //         data.naColDropThreshold = $('#na_col_drop_threshold').val();      		// "Else" unnecessary
        //     }else{
        //         alert("Threshold 값을 확인해 주세요.")
        //         return false;
        //     }
        //     console.log('1. na_col_drop_threshold = ',data.naColDropThreshold ) ;
        // }


        // ---------------- 2. Outlier Elimination - Loop Impossible -------------------------
        if  ($('#pre_OtlrElmntn').is(':checked')) {
            data.outlierUse = true;
            showOutlier =true
            // var outlier_columns = $('select[id=pre_Ocolumn]').val();

            // data.outlierColumns = outlier_columns;					// Outlier Elimination Column
            // console.log('3.1  outlier_cols : ',data.outlierColumns) ;


            data.outlierStrategy = $('select[id=pre_Omethod]').val();			 			// Outlier Elimination Method



            if  (chkItem($('#pre_Othreshold').val())) {										// Outlier Elimination stratege
                data.outlierThreshold = $('#pre_Othreshold').val();
            }else{
                alert("Threshold 값을 확인해 주세요.")
                return false;
            }
        }else{
            data.outlierUse = false;
            showOutlier =false
        }


        // ---------------- 3. Power Transformation - Column / Strategy -------------------------
        if  ($('#pre_PrTrnsfrm').is(':checked')) {
            data.colTransUse = true
            showPowerTrans = true
            var col_trans_columns = []
            $(".pre_Pcolumns").each(function () {
                col_trans_columns.push($(this).val())
            });
            data.colTransColumns = col_trans_columns

            var col_trans_strategies = [];
            $(".pre_Pstrategies").each(function () {
                col_trans_strategies.push($(this).val())
            });
            data.colTransStrategies = col_trans_strategies
        }else{
            data.colTransUse = false;
            showPowerTrans = false
        }

        // -------------------------- 4. One Hot Encoding -------------------------------


        // // ---------------------- 5. Feature Selection - K -------------------------
        // if  (chkItem($('input:checkbox[id=pre_FtrSlcon]').is(":checked"))) {
        // 	if  (chkItem($('#pre_feature_k').val())) {										// 일단보류
        // 		data.pre_feature_k = $('#pre_feature_k').val();
        // 		console.log('5.  pre_feature_k : ',data.pre_feature_k) ;
        // 	}
        // }

        // --------------------------- 6. Scaling ----------------------------------
        // if  ($('#pre_Scaling').is(':checked')) {
        //     data.scalerUse = true;
        //     data.scalerStrategy = $("#pre_Sstrategy option:selected").val();
        //     console.log('6.  scaler : ',data.scalerStrategy) ;
        // }

        // // ---------------- 7. Dimensionality Reduction --------------------------
        // if  ($('#pre_DmnsnltyRdctn').is(':checked')) {
        //     data.dim_reduc_strategy = $("#pre_algorithm option:selected").text(); 			 	// 일단보류
        //     console.log('7.1  dim_reduc_strategy : ',data.dim_reduc_strategy) ;
        //
        //
        // 	if  (chkItem($('#pre_numFeature').val())) {
        // 		data.dim_reduc_n = $('#pre_numFeature').val() ;
        // 		console.log('7. dim_reduc_n : ',data.dim_reduc_n) ;
        // 	}
        // }
        return $.ajax({
            type: 'patch',
            url : g_RESTAPI_HOST_BASE + 'datasets/{0}/'.format(datasetId),//'runtimes/'+runtime_id + '/dataset/',
            data: JSON.stringify(data),
            dataType: 'json',
            contentType: 'application/json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    //$('#modal-setting').modal('hide');
                } else {
                    alert(resultData['error_msg']);
                }
            },
            error: function (res) {
                alert(res.responseJSON.message);
            }
        })

    };

    _p.preprocess = function(){

        return $.ajax({
            type: 'post',
            url: g_RESTAPI_HOST_BASE + 'runtimes/'+runtime_id + '/dataset_preprocessed/preprocess/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    //_p.loadStatus()
                    _p.loadPipeline()
                    alert("Preprocess를 요청하였습니다.");

                } else {
                    alert(resultData['error_msg']);
                }
            },
            error: function (res) {
                alert(res.responseText);
            }
        })
    };

    return module;
}($FRONTEND || {}));
