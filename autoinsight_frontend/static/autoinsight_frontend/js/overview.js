var $FRONTEND = (function (module) {
    var _p = module._p = module._p || {};

    //초기화면 세팅
    _p.init = function(){
        _p.loadRuntimeInfo()
        _p.loadOverviewArea()

        $('.gen-conf').change(function() {
            _p.updateRuntimeConf()
        });

        $('#gen_max_eval_time').change(function() {
            var max_eval_time = $(this).val()
            var tmp = Math.floor($('#gen_time_out').val()/10)

            if (max_eval_time < 1 ||max_eval_time > tmp) {
                alert("Max Evaluation Time은 최소 1에서 최대 "+tmp+"사이의 값으로 입력해 주세요");
                $(this).val(tmp)
                return false;
            }
            _p.updateRuntimeConf()
        });

        $('#resampling_strategy').change(function() {
            if ($(this).val() === 'holdout') {
                $('#k_folds_area').hide();
                $('#train_split_area').show();
            }else{
                $('#k_folds_area').show();
                $('#train_split_area').hide();
            }
        });

        $('#overview_column_table').on('load-success.bs.table', function (data, jqXHR) {
            if(jqXHR.length<20){
                $('.dist_buttons').hide()
                $('canvas').show()
                $(jqXHR).each(function(index, column) {
                    _p.drawDistribution(column.id, column.freqIdxJson, column.freqJson)
                });

            }else{
                $('canvas').hide()
                $('.dist_buttons').show()
                distributions={};
                $(jqXHR).each(function(index, column) {
                    distributions[column.id]  = [column.freqIdxJson, column.freqJson]
                });

            }

        });



    }

    //Runtime 관련

    _p.loadRuntimeInfo = function() {
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id+'/dataset_preprocessed/columns/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null) {
                    columnCombobox ="";
                    $.each(resultData, function( index, value ) {
                        columnCombobox += '<option value="'+value.name+'">'+value.name+'</option>';
                    });
                    $('#target').html(columnCombobox)

                    $.ajax({
                        type: 'get',
                        url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id + '/',
                        dataType: 'json',
                        success: function (resultData, textStatus, request) {
                            $("#runtime_name").text("Exeperiment-"+resultData['id']);
                            $('#target').val(resultData.targetColumnName)

                            $('#estimator_type').val(resultData.estimatorType)
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
                            if (resultData['resamplingStrategy']=== 'holdout') {
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


                            tmp = resultData['maxEvalTime']/60;
                            $('#gen_max_eval_time').val(tmp);

                            if(resultData['useAutosklearn']){
                                $('#autosklearn').prop( "checked", true );
                            }

                            if(resultData['useTpot']){
                                $('#tpot').prop( "checked", true );
                            }
                            if(resultData['useEnsemble']){
                                $('#ensemble').prop( "checked", true );
                            }

                            if(resultData['includeOneHotEncoding']){
                                $('#pre_1HotEncod').prop( "checked", true );
                            }

                            if(resultData['includeVarianceThreshold']){
                                $('#pre_VarThreshold').prop( "checked", true );
                            }


                            smethodCombobox ="";
                            $.each(resultData['availableScalingMethods'], function( index, value ) {
                                smethodCombobox += '<option value="'+value+'">'+value+'</option>';
                            });

                            $('#pre_SMethod').html(smethodCombobox);

                            $('#pre_SMethod').multiselect(
                                {
                                    includeSelectAllOption: true,
                                    numberDisplayed: 1,
                                    onChange: function($option) {
                                        // Check if the filter was used.
                                        var query = $('#pre_SMethod li.multiselect-filter input').val();
                                        if (query) {
                                            $('#pre_SMethod li.multiselect-filter input').val('').trigger('keydown');
                                        }
                                    }
                                }
                            );
                            if(resultData['includeScalingMethods'].length !== 0) {
                                $('#pre_Scaling').prop( "checked", true )
                                $('#pre_SMethod').multiselect('select', resultData['includeScalingMethods']);
                                $('#pre_SMethod').multiselect('refresh');
                            }

                            fmethodCombobox ="";
                            $.each(resultData['availableFeatureEngineerings'], function( index, value ) {
                                if(value === resultData['availableFeatureEngineerings']){
                                    fmethodCombobox += '<option value="'+value+'" selected>'+value+'</option>';
                                }else{
                                    fmethodCombobox += '<option value="'+value+'">'+value+'</option>';
                                }
                            });
                            $('#pre_FMethod').html(fmethodCombobox);

                            $('#pre_FMethod').multiselect(
                                {
                                    includeSelectAllOption: true,
                                    numberDisplayed: 1,
                                    onChange: function($option) {
                                        // Check if the filter was used.
                                        var query = $('#pre_FMethod li.multiselect-filter input').val();
                                        if (query) {
                                            $('#pre_FMethod li.multiselect-filter input').val('').trigger('keydown');
                                        }
                                    }
                                }
                            );

                            if(resultData['includeFeatureEngineerings'].length !== 0) {
                                $('#pre_FtrSlcon').prop( "checked", true )
                                $('#pre_FMethod').multiselect('select', resultData['includeFeatureEngineerings']);
                                $('#pre_FMethod').multiselect('refresh');
                            }

                            var estimatorHtml = ""
                            $.each(resultData['availableEstimators'], function( index, value ) {
                                estimatorHtml +='<div class="wrap_check">'
                                if($.inArray(value, resultData['includeEstimators'] ) !== -1){
                                    estimatorHtml += '<input type="checkbox" name="'+value+'" id="'+value+'" class="inp_check modal_check estimators" onchange="$FRONTEND._p.updateRuntimeConf()" checked>'
                                }else{
                                    estimatorHtml += '<input type="checkbox" name="'+value+'" id="'+value+'" class="inp_check modal_check estimators" onchange="$FRONTEND._p.updateRuntimeConf()">'
                                }
                                estimatorHtml += '<label for="'+value+'" class="label_check"><span class="ico_automl ico_check"></span>'+value+'</label></div><br>'
                            });
                            $('#available_estimators').html(estimatorHtml)


                        },
                        error: function (res) {
                            alert(res.responseJSON.message);
                        }
                    })

                } else {
                    alert(resultData['error_msg']);
                }
            },
            error: function (res) {
                console.log(res);
            }
        })


    }

    _p.loadOverviewArea = function(){
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id+'/dataset_preprocessed/preview_source/',
            contentType: "application/json",
            success: function (resultData, textStatus, request) {
                $('#overview_preview_table').bootstrapTable('destroy')
                var columns =[]
                $.each(resultData[0], function(key, value){
                    columns.push({
                        title: key,
                        field: key
                    })
                });
                $('#overview_preview_table').bootstrapTable({
                    columns: columns
                })

                $('#overview_preview_table').bootstrapTable('load',{rows: resultData})

                var columns = [{
                    class: 'txt_l',
                    field: 'name',
                    title: 'Name'
                }, {
                    field: 'datatype',
                    title: 'Datatype'
                }, {
                    field: 'missing',
                    title: 'Missing'
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
                }]
                $('#overview_column_table').bootstrapTable('destroy')
                $('#overview_column_table').bootstrapTable({
                    url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id+'/dataset_preprocessed/columns/',
                    columns: columns
                })

            },
            error: function (res) {
                console.log(res);
            }
        });
    }
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




    _p.updateRuntimeConf = function() {
        var data = {};
        data.estimatorType = $('#estimator_type option:selected').val();
        data.targetColumnName = $('#target option:selected').val();
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

        var max_eval_time = $('#gen_max_eval_time').val();
        data.maxEvalTime = max_eval_time*60;

        if  ($('#autosklearn').is(':checked')) {
            data.useAutosklearn = true;
        }else{
            data.useAutosklearn = false;
        }

        if  ($('#tpot').is(':checked')) {
            data.useTpot = true;
        }else{
            data.useTpot = false;
        }

        if  ($('#ensemble').is(':checked')) {
            data.useEnsemble = true;
        }else{
            data.useEnsemble = false;
        }

        if  ($('#pre_1HotEncod').is(':checked')) {
            data.includeOneHotEncoding = true;
        }else{
            data.includeOneHotEncoding = false;
        }

        if  ($('#pre_VarThreshold').is(':checked')) {
            data.includeVarianceThreshold = true;
        }else{
            data.includeVarianceThreshold = false;
        }

        if  ($('#pre_Scaling').is(':checked')) {

            data.includeScalingMethodsJson = JSON.stringify($('select[id=pre_SMethod]').val());
        }

        if  ($('#pre_FtrSlcon').is(':checked')) {

            data.includeFeatureEngineeringsJson = JSON.stringify($('select[id=pre_FMethod]').val());
        }

        var include_estimators = []
        $(".estimators").each(function () {
            if($(this).is(":checked")) include_estimators.push($(this)[0].name)
        });
        data.includeEstimatorsJson = JSON.stringify(include_estimators)

        return $.ajax({
            type: 'patch',
            url: g_RESTAPI_HOST_BASE + 'runtimes/'+runtime_id +'/',
            data: JSON.stringify(data),
            dataType: 'json',
            contentType: 'application/json',
            error: function (res) {
                console.log(res)
            }
        })
    };



    return module;
}($FRONTEND || {}));
