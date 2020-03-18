var $FRONTEND = (function (module) {
    var _p = module._p = module._p || {};


    _p.dataset_name ="";
    var targetColumn, isFirst, showOutlier, showPowerTrans, distributions;
    //초기화면 세팅
    _p.init = function(){

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

        var status = _p.loadStatus();
        isFirst = true;

        // _p.refreshOrigTable()



        $('#dataset').on('fileuploaded', function (objectEvent, params){
            alert("파일이 저장되었습니다.");
            $('.modal').modal('hide');
            _p.loadStatus();
            $('#column_table').bootstrapTable('refresh')
        });

        _p.loadPreConf().done(function() {
            _p.showConfColumns()
        });

        $('#column_table').on('load-success.bs.table', function (data, jqXHR) {
            targetColumn={};
            if(jqXHR.length<20){
                $('.dist_buttons').hide()
                $('canvas').show()
                $(jqXHR).each(function(index, column) {
                    _p.drawDistribution(column.id, column.freqIdxJson, column.freqJson);
                    if(column.isTarget){
                        $('#feature_'+column['id']).attr("disabled", true);
                        if(isFirst === true){
                            if(column.taskType === 'multiclass' || column.taskType === 'binary'){
                                $('#estimator_type').val("classifier");
                                $('#metric').val('accuracy');
                            }else{
                                $('#estimator_type').val("regressor");
                                $('#metric').val('r2');
                            }
                            if(status === 'ready') _p.updateEstimatorType();
                            isFirst = false
                        }
                        targetColumn.id = column.id;
                        targetColumn.name = column.name;
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
                        if(isFirst === true){
                            if(column.taskType === 'multiclass' || column.taskType === 'binary'){
                                $('#estimator_type').val("classifier");
                                $('#metric').val('accuracy');
                            }else{
                                $('#estimator_type').val("regressor");
                                $('#metric').val('r2');
                            }
                            if(status === 'ready') _p.updateEstimatorType();
                            isFirst = false
                        }
                        targetColumn.id = column.id;
                        targetColumn.name = column.name;
                    }
                });

            }



            // $( ".columns" ).each(function( index ) {
            //     $(this).html(columnCombobox);
            // });


            $('.toggle-disable').prop('disabled', false)
            $('#preprocess_loader').removeClass("loader")

        });

        $('#estimator_type').change(function() {
            _p.updateEstimatorType();
        });


        $('#modal-setting').on('shown.bs.modal', function (e) {
            $('.gen-conf').change(function() {
                _p.saveGenConf()
            });
            $('.pre-conf').change(function() {
                _p.savePreConf()
            });
            $('#gen_max_eval_time').change(function() {
                var max_eval_time = $(this).val()
                var tmp = Math.floor($('#gen_time_out').val()/10)

                if (max_eval_time < 1 ||max_eval_time > tmp) {
                    alert("Max Evaluation Time은 최소 1에서 최대 "+tmp+"사이의 값으로 입력해 주세요");
                    $(this).val(tmp)
                    return false;
                }
                _p.saveGenConf()
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
                if ($(this).val() === 'BoxPlotRule') {
                    $('#pre_Othreshold_all').hide();
                }else{
                    $('#pre_Othreshold_all').show();
                }
            });
            _p.loadGenConf()
            return false


        });

        $("#modal-setting").on('hide.bs.modal', function(){
            _p.showConfColumns();
        });

    };



    _p.loadStatus = function (){
        var status =""
        $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id + '/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                //화면 세팅
                status = resultData.status
                if(resultData.status === "ready"){
                    $('.toggle-disable').prop('disabled', false);
                    $('#loader').removeClass("loader");
                }else if(resultData.status === "learning"){
                    $('.toggle-disable').prop('disabled', true);
                    $('#leaderboard_loader').addClass("loader");
                }else{
                    $('.toggle-disable').prop('disabled', true);
                }
                $('#estimator_type').val(resultData.estimatorType);
            },
            error: function (res) {
                alert(res.responseJSON.message);
            }
        });
        $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id+'/dataset/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    $("#dataset_info").show();
                    $("#dataset_name").text(resultData['name']);
                    $("#row_count").text(resultData['rowCount']);
                    $("#col_count").text(resultData['colCount']);

                    if(resultData['isProcessed']===false){
                        $('#preprocessed_link').addClass('disabled');
                    }else{
                        $('#preprocessed_link').removeClass('disabled');

                    }
                } else {
                    alert(resultData['error_msg']);
                }
            },
            error: function (res) {
                alert(res.responseJSON.message);
            }
        });
        return status
    };

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


    //테이블 관련


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
        var obj_imputations = ['None', 'drop', 'Most Frequent', 'Unknown'];
        var num_imputations = ['None', 'drop', 'Most Frequent', 'Mean', 'Median', '0', 'Minimum'];
        if(row.missing==0){

            return '<div class="wrap_select"><select id="imputation_' + row.id + '" class="form-control" data-style="btn-info" disabled><option value="None">None</option></select></div>'
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
            var strategies = ['None', 'Log', 'SquaredRoot', 'Square', 'BoxCoxTransformation', 'YeoJohnsonTransformation'];
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
            str = '<div class="wrap_check type_check3 on"><input type="radio" id="target_'+row.id+'" name="target" colum_name="'+row.name+'" class="inp_check toggle-disable" onclick="$FRONTEND._p.updateTarget('+row.id+')" checked><label for="target_'+row.id+'" class="label_check"><span class="ico_automl ico_check">sepal.lenght Features</span></label></div>'
        }else{
            str = '<div class="wrap_check type_check3"><input type="radio" id="target_'+row.id+'" name="target" colum_name="'+row.name+'" class="inp_check toggle-disable" onclick="$FRONTEND._p.updateTarget('+row.id+')"><label for="target_'+row.id+'" class="label_check"><span class="ico_automl ico_check">sepal.lenght Features</span></label></div>'
        }
        return str;
    };

    _p.showConfColumns = function(){
        if(showOutlier) {
            $('#outlier_col').css("width", "150px")
        }else{
            $('#outlier_col').css("width", "0px")
        }
        if(showPowerTrans){
            $('#powerTrans_col').css("width", "150px")
        } else{
            $('#powerTrans_col').css("width", "0px")
        }

        if (showOutlier && showPowerTrans) {
            $('main > .container').css("max-width", "1580px");//1280+150*2
        }
        else if (showOutlier || showPowerTrans) {
            $('main > .container').css("max-width", "1430px"); //1280+150
        }
        else {
            $('main > .container').css("max-width", "1280px");
        }
        $('#column_table').bootstrapTable('refresh')
    }

    _p.updateColumn = function(rowid) {
        var data = {};
        data.datatype = $('#datatype_' + rowid).val();
        data.imputation = $('#imputation_' + rowid).val();
        data.transformationStrategy = $('#powertrans_' + rowid).val();
        data.useOutlier = $('#outlier_' + rowid).is(":checked");
        data.isFeature = $('#feature_' + rowid).is(":checked");
        return $.ajax({
            type: 'patch',
            url: g_RESTAPI_HOST_BASE + 'runtimes/'+runtime_id+'/dataset/columns/{0}/'.format(rowid),
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

    _p.updateEstimatorType = function(rowid) {
        var data = {};
        data.estimatorType = $('#estimator_type option:selected').val();
        return $.ajax({
            type: 'patch',
            url: g_RESTAPI_HOST_BASE + 'runtimes/'+runtime_id+'/',
            data: JSON.stringify(data),
            dataType: 'json',
            contentType: 'application/json',
            error: function (res) {
                alert(res.responseJSON.message);
            }
        })
    };

    _p.updateTarget = function(rowid){
        var data ={};
        data.isTarget = false;
        return $.ajax({
            type: 'patch',
            url: g_RESTAPI_HOST_BASE + 'runtimes/'+runtime_id + '/dataset/columns/{0}/'.format(targetColumn.id),
            data: data,
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    var data ={};
                    $('.features').removeAttr("disabled");
                    $('#feature_'+rowid).attr("disabled", true);
                    data.isFeature = false;
                    data.isTarget = true;
                    $.ajax({
                        type: 'patch',
                        url: g_RESTAPI_HOST_BASE + 'runtimes/'+runtime_id + '/dataset/columns/{0}/'.format(rowid),
                        data: data,
                        dataType: 'json',
                        success: function (resultData, textStatus, request) {
                            if (resultData['error_msg'] == null ){
                                targetColumn.id = resultData.id;
                                targetColumn.name = resultData.name;
                                if(resultData.taskType === 'multiclass' || resultData.taskType === 'binary'){
                                    $('#estimator_type').val("classifier");
                                }else{
                                    $('#estimator_type').val("regressor");
                                }
                                _p.updateEstimatorType();
                                $('#feature_'+rowid).prop("checked", false);
                                $('#feature_'+rowid).attr("disabled", true);
                            } else {
                                alert(resultData['error_msg']);
                            }
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
                alert(res.responseJSON.message);
            }
        })
    };

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
            url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id+'/dataset/stat_corr/',
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
        $('#pre_Omethod').val("Zscore");
        $('#pre_Othreshold_all').show();
        $('#pre_Othreshold').val(3);
        // $('#pre_Pstrategy_0').val("YeoJohnsonTransformation");
        $('#pre_Sstrategy').val("Standard");

    };

    _p.loadPreConf = function() {
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE + 'runtimes/'+runtime_id + '/dataset/',
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

    _p.loadGenConf = function() {
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id,
            dataType: 'json',
            success: function (resultData, textStatus, request) {
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
                if(resultData['includeScalingMethods'] !== null) {
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

                if(resultData['includeFeatureEngineerings'] !== null) {
                    $('#pre_FtrSlcon').prop( "checked", true )
                    $('#pre_FMethod').multiselect('select', resultData['includeFeatureEngineerings']);
                    $('#pre_FMethod').multiselect('refresh');
                }

                var estimatorHtml = ""
                $.each(resultData['availableEstimators'], function( index, value ) {
                    estimatorHtml +='<div class="wrap_check">'
                    if($.inArray(value, resultData['includeEstimators'] ) !== -1){
                        estimatorHtml += '<input type="checkbox" name="'+value+'" id="'+value+'" class="inp_check modal_check estimators" onchange="$FRONTEND._p.saveGenConf()" checked>'
                    }else{
                        estimatorHtml += '<input type="checkbox" name="'+value+'" id="'+value+'" class="inp_check modal_check estimators" onchange="$FRONTEND._p.saveGenConf()">'
                    }
                    estimatorHtml += '<label for="'+value+'" class="label_check"><span class="ico_automl ico_check"></span>'+value+'</label></div><br>'
                });
                $('#available_estimators').html(estimatorHtml)


            },
            error: function (res) {
                alert(res.responseJSON.message);
            }
        });
    }

    _p.autoConf = function(){
        return $.ajax({
            type: 'post',
            url: g_RESTAPI_HOST_BASE + 'runtimes/'+runtime_id +'/dataset/recommend_config/',
            dataType: 'json',
            contentType: 'application/json',
            success: function (resultData, textStatus, request) {
                _p.loadPreConf()
                _p.loadGenConf()
                $('#column_table').bootstrapTable('refresh',{silent: true})
            },
            error: function (res) {
                alert(res.responseText);
            }
        })

    };

    // _p.addPowerTrans = function(i){
    //     i  = parseInt(i);
    //     var appendHtml = '<div id="appended_'+i+'"><div class="item_dl type_inline"><dt></dt><dd>' +
    //         '<div class="wrap_select"><select id="pre_Pcolumn_'+i+'" class="pre_Pcolumns form-control conf">'+
    //         columnCombobox+
    //         '</select>' +
    //         '</div></dd><dd><div class="wrap_select">'+
    //         '<select id="pre_Pstrategy_'+i+'" class="pre_Pstrategies form-control conf">' +
    //         '<option value="Log" selected>Log</option>' +
    //         '<option value="SquaredRoot">Squared Root</option>' +
    //         '<option value="Square">Square</option>' +
    //         '<option value="BoxCoxTransformation">Box-Cox Transformation</option>' +
    //         '<option value="YeoJohnsonTransformation" selected>Yeo-Johnson Transformation</option>' +
    //         '</select></div></dd>' +
    //         '<button type="button" class="btn_cal toggle-disable" onclick="$FRONTEND._p.removePowerTrans({0})">-</button></div>'.format(i)+
    //         '<div class="txt_next"><button type="button" class="btn_cal toggle-disable" onclick="$FRONTEND._p.addPowerTrans({0})">+</button></div></div>'.format(i+1);
    //     $('#powerTrans_area').append(appendHtml);
    //
    // };
    //
    // _p.removePowerTrans = function(i){
    //     $('#appended_'+i).remove();
    // };

    //AJAX call
    String.prototype.format = function() {
        a = this;
        for (k in arguments) {
            a = a.replace("{" + k + "}", arguments[k])
        }
        return a
    };


    function chkItem(chkValue) {
        if (chkValue === '' || chkValue === ' ') {
            alert('입력 값을 확인해 주세요', chkValue) ;
            return false ;
        } else if (Number.isInteger(+chkValue)) {
            return true ;
        }
        else {
            alert('Warning. Checked item is what?', chkValue) ;
            return false ;
        }
    }


    _p.saveGenConf = function() {
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

        var max_eval_time = $('#gen_max_eval_time').val();
        data.maxEvalTime = max_eval_time*60;

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
            success: function (resultData, textStatus, request) {

            },
            error: function (res) {
                console.log(res)
            }
        })
    };

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
            url : g_RESTAPI_HOST_BASE + 'runtimes/'+runtime_id + '/dataset/',
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
            url: g_RESTAPI_HOST_BASE + 'runtimes/'+runtime_id + '/dataset/preprocess/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    _p.loadStatus()
                    alert("Preprocess 완료되었습니다.");
                } else {
                    alert(resultData['error_msg']);
                }
            },
            error: function (res) {
                alert(res.responseText);
            }
        })
    };

    _p.runAutoml = function(){
        return $.ajax({
            type: 'post',
            url : g_RESTAPI_HOST_BASE + 'runtimes/'+runtime_id + '/start/',
            dataType: 'json',
            contentType: 'application/json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    alert("AutoML 구동을 시작합니다.") ;
                    window.location.replace("/leaderboard/"+runtime_id+"/");
                } else {
                    alert(resultData['error_msg']);
                }
            },
            error: function (res) {
                alert(res.responseJSON.message);
            }
        })
    };

    //Preview 관련
    // _p.refreshOrigTable = function () {
    //     return $.ajax({
    //         type: 'get',
    //         url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id+'/dataset/source_X/',
    //         contentType: "application/json",
    //         success: function (resultData, textStatus, request) {
    //             var columns =[]
    //             $.each(resultData[0], function(key, value){
    //                 columns.push({
    //                     title: key,
    //                     field: key
    //                 })
    //             });
    //
    //             var table_data = resultData
    //
    //             $.ajax({
    //                 type: 'get',
    //                 url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id+'/dataset/source_y/',
    //                 contentType: "application/json",
    //                 success: function (resultData, textStatus, request) {
    //
    //                     $.each(resultData[0], function(key, value){
    //                         columns.push({
    //                             title: key,
    //                             field: key
    //                         })
    //                     });
    //                     $('#original_table').bootstrapTable({
    //                         columns: columns
    //                     })
    //                     $.each(resultData, function(index, value){
    //                         $.each(value, function(key, value){
    //                             table_data[index][key] = value
    //                         });
    //                     })
    //
    //
    //                     $('#original_table').bootstrapTable('load',{rows: table_data})
    //
    //                 },
    //                 error: function (res) {
    //                     console.log(res);
    //                 }
    //             });
    //
    //         },
    //         error: function (res) {
    //             console.log(res);
    //         }
    //     });
    //
    //
    // }
    //
    // _p.loadPreprocessed = function () {
    //     return $.ajax({
    //         type: 'get',
    //         url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id+'/dataset/preprocessed_X/',
    //         contentType: "application/json",
    //         success: function (resultData, textStatus, request) {
    //             columns =[]
    //             $.each(resultData[0], function(key, value){
    //                 columns.push({
    //                     title: key,
    //                     field: key
    //                 })
    //             });
    //
    //             table_data = resultData
    //
    //             $.ajax({
    //                 type: 'get',
    //                 url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id+'/dataset/preprocessed_y/',
    //                 contentType: "application/json",
    //                 success: function (resultData, textStatus, request) {
    //
    //                     $.each(resultData[0], function(key, value){
    //                         columns.push({
    //                             title: key,
    //                             field: key
    //                         })
    //                     });
    //                     $('#preprocessed_table').bootstrapTable({
    //                         columns: columns
    //                     })
    //                     $.each(resultData, function(index, value){
    //                         $.each(value, function(key, value){
    //                             table_data[index][key] = value
    //                         });
    //                     })
    //
    //                     $('#preprocessed_table').bootstrapTable('load',{rows: table_data})
    //
    //                 },
    //                 error: function (res) {
    //                     console.log(res);
    //                 }
    //             });
    //
    //         },
    //         error: function (res) {
    //             console.log(res);
    //         }
    //     });
    // }

    return module;
}($FRONTEND || {}));
