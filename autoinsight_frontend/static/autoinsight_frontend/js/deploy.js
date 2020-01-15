var $FRONTEND = (function (module) {
    var _p = module._p = module._p || {};
    var columns =[]
    _p.init = function () {
        _p.getStatus()
        _p.getDeployment()
        _p.getColumns()
    }

    _p.getStatus = function(){
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE + 'runtime/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    if(resultData['live']===true){
                        $('#leaderboard_loader').addClass("loader")
                    }else{
                        $('#leaderboard_loader').removeClass("loader")
                    }
                } else {
                    console.log(resultData['error_msg'])
                }
            },
            error: function (res) {
                console.log("Ajax call failure")
            }
        })
    }

    _p.getDeployment = function(){
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE + 'deployment/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    $('#estimator_name').text(resultData.target.estimatorName)
                    $('#score').text(resultData.target.score)
                    $('#created_at').text(resultData.createdAt)
                } else {
                    console.log(resultData['error_msg'])
                }
            },
            error: function (res) {
                console.log("Ajax call failure")
            }
        })
    }

    _p.getColumns = function(){
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE + 'dataset/columns/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    var tablehtml = ""
                    $(resultData).each(function(index, column) {
                        if(column.isTarget === false){
                            columns.push(column.name)
                            tablehtml += '<tr><td>'+column.name+'</td><td>'+column.datatype+'</td><td><input type="text" class="form-control predict-input" mean="'+column.mean+'"></td></tr>'
                        }
                    })
                    $('#predict_table').html(tablehtml)
                } else {
                    console.log(resultData['error_msg'])
                }
            },
            error: function (res) {
                console.log("Ajax call failure")
            }
        })
    }

    _p.fillMean = function(){
        $(".predict-input").each(function(index, value) {
            $(this).val($(this).attr("mean"))
        })
    }

    _p.predict = function(){
        var data = {}
        inputstring =""
        len = $(".predict-input").length
        $(".predict-input").each(function(index, value) {
            inputstring+=$(this).val()
            if(index+1 < len) inputstring+= ","
        })
        data.inputs = inputstring

        return $.ajax({
            type: 'post',
            url: g_RESTAPI_HOST_BASE + 'deployment/predict/',
            data: data,
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    alert("예측결과 : "+resultData.result[0])

                } else {
                    console.log(resultData['error_msg'])
                }
            },
            error: function (res) {
                console.log("Ajax call failure")
            }
        })
    }


    return module;
}($FRONTEND || {}));
