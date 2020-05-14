var $FRONTEND = (function (module) {
    var _p = module._p = module._p || {};
    //초기화면 세팅
    _p.base = function(){
        _p.loadStatus()
        $('html').click(function(e){
            if(!$(e.target).hasClass('layer')){
                $('#run-setting').css('display','none')
            }
        })

    };



    _p.loadStatus = function (){
        status =""
        targetColumnName = ""
        $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id + '/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                var status = resultData.status
                //화면 세팅
                if(status === "ready"){
                    $('.loader').removeClass("loader");
                    $('#runButton').prop('disabled', false);
                    $('#runButton').addClass('btn_run');
                    $('#runButton').html('Run AutoML <span class="ico_automl ico_arr"></span>')
                    $('.toggle-disable').prop('disabled', false);
                    $('#preprocessButton').prop('disabled', false);
                    $('.gen-conf').prop('disabled', false);
                    $('.pre-conf').prop('disabled', false);

                }else{
                    $('#runButton').prop('disabled', true);
                    if(status === "preprocessing"){
                        $('#preprocess_loader').addClass("loader")
                        $('#runButton').html('Preprocessing')
                    }
                    if(status === "learning"){
                        $('#leaderboard_loader').addClass("loader")
                        $('#runButton').html('Learning')
                    }
                    if(status === "finished"){
                        $('.loader').removeClass("loader");
                        $('#runButton').html('Finished')
                    }
                    if(status === "error"){
                        $('.loader').removeClass("loader");
                        $('#runButton').html('Error')
                    }

                    $('.toggle-disable').prop('disabled', true);
                    $('#preprocessButton').prop('disabled', true);
                    $('.gen-conf').prop('disabled', true);
                    $('.pre-conf').prop('disabled', true);

                }
            },
            error: function (res) {
                alert(res.responseJSON.message);
            }
        });
    };


    //Modal 관련
    _p.setRunModal = function(){


        var CONFIRM_RUNTIMES_QUERY = `
                                    query {
                                      runtime (id: `+runtime_id+`) {
                                        id
                                        metric
                                        availableMetrics
                                        estimatorType
                                        targetColumnName
                                        dataset {
                                          id
                                          name
                                        }
                                      }
                                    }
                                    `;

        return $.ajax({
            type: 'post',
            url: g_RESTAPI_HOST_BASE+'graphql',
            data: JSON.stringify({query:CONFIRM_RUNTIMES_QUERY}),
            contentType: "application/json",
            success: function (resultData, textStatus, request) {
                if(resultData.data.runtime.estimatorType==="CLASSIFIER"){
                    $('#regression_confirm').removeClass("on")
                    $('#classification_confirm').addClass("on")
                }else{
                    $('#classification_confirm').removeClass("on")
                    $('#regression_confirm').addClass("on")
                }
                $('#target_confirm').text(resultData.data.runtime.targetColumnName);
                metricCombobox ="";
                $.each(resultData.data.runtime.availableMetrics, function( index, value ) {
                    if(value === resultData.data.runtime.metric){
                        metricCombobox += '<option value="'+value+'" selected>'+value+'</option>';
                    }else{
                        metricCombobox += '<option value="'+value+'">'+value+'</option>';
                    }
                });
                $('#metric_confirm').html(metricCombobox);
                $('#run-setting').css('display','block')
            },
            error: function (res) {
                console.log(res)
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

    _p.updateMetric = function(estimator_type) {
        var data = {};
        data.metric = $('#metric_confirm option:selected').val()
        return $.ajax({
            type: 'patch',
            url: g_RESTAPI_HOST_BASE + 'runtimes/'+runtime_id+'/',
            data: JSON.stringify(data),
            dataType: 'json', //
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    _p.setRunModal()
                }
            },
            contentType: 'application/json',
            error: function (res) {
                alert(res.responseJSON.message);
            }
        })
    };

    _p.updateEstimatorType = function(estimator_type) {
        var data = {};
        if(estimator_type===null) estimator_type = $('#estimator_type option:selected').val();
        data.estimatorType = estimator_type
        return $.ajax({
            type: 'patch',
            url: g_RESTAPI_HOST_BASE + 'runtimes/'+runtime_id+'/',
            data: JSON.stringify(data),
            dataType: 'json', //
            success: function (resultData, textStatus, request) {
                try {
                    _p.loadRuntimeInfo()
                }
                catch (e) {
                    console.log(e);
                }
                _p.setRunModal()



            },
            contentType: 'application/json',
            error: function (res) {
                alert(res.responseJSON.message);
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
                console.log(res);
            }
        })
    };

    return module;
}($FRONTEND || {}));
