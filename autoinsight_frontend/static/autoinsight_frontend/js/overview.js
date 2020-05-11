var $FRONTEND = (function (module) {
    var _p = module._p = module._p || {};

    var status;
    //초기화면 세팅
    _p.init = function(){

        status = _p.loadStatus()
        _p.loadRuntimeInfo()

        $('.gen-conf').change(function() {
            _p.updateGenConf()
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



    }

    _p.loadStatus = function (){
        status =""
        $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id + '/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                //화면 세팅
                status = resultData.status
                if(status === "ready"){
                    $('#loader').removeClass("loader");
                    $('#runButton').prop('disabled', false);
                    $('.toggle-disable').prop('disabled', false);
                    $('.gen-conf').prop('disabled', false);
                    $('.pre-conf').prop('disabled', false);

                }else{
                    if(status === "preprocessing"){
                        $('#preprocess_loader').addClass("loader");
                    } else if(resultData.status === "learning"){
                        $('#leaderboard_loader').addClass("loader");
                    }

                    $('#runButton').prop('disabled', true);
                    $('.toggle-disable').prop('disabled', true);
                    $('.gen-conf').prop('disabled', true);
                    $('.pre-conf').prop('disabled', true);

                }
            },
            error: function (res) {
                alert(res.responseJSON.message);
            }
        });
        return status
    };




    //Runtime 관련

    _p.loadRuntimeInfo = function() {
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id,
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                $("#runtime_name").text("Exeperiment-"+resultData['id']);
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
                        estimatorHtml += '<input type="checkbox" name="'+value+'" id="'+value+'" class="inp_check modal_check estimators" onchange="$FRONTEND._p.updateGenConf()" checked>'
                    }else{
                        estimatorHtml += '<input type="checkbox" name="'+value+'" id="'+value+'" class="inp_check modal_check estimators" onchange="$FRONTEND._p.updateGenConf()">'
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

    //AJAX call
    String.prototype.format = function() {
        a = this;
        for (k in arguments) {
            a = a.replace("{" + k + "}", arguments[k])
        }
        return a
    };

    _p.updateGenConf = function() {
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
            success: function (resultData, textStatus, request) {

            },
            error: function (res) {
                console.log(res)
            }
        })
    };



    return module;
}($FRONTEND || {}));
