var $FRONTEND = (function (module) {
    var _p = module._p = module._p || {};
    var columns
    _p.init = function () {
        $('#deployed').hide()
        $('#not_deployed').hide()
        $('#bulk_result').hide()
        $('#single_result').hide()
        _p.getStatus()
        _p.getDeployment()
        _p.getColumns()
    }

    _p.getStatus = function(){
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE +'runtimes/'+runtime_id + '/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    if(resultData['status']==="learning"){
                        $('#leaderboard_loader').addClass("loader")
                    }else{
                        $('#leaderboard_loader').removeClass("loader")
                    }
                } else {
                    console.log(resultData['error_msg'])
                }
            },
            error: function (res) {
                console.log(res.responseJSON.message)
            }
        })
    }

    _p.getDeployment = function(){
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE +'runtimes/'+runtime_id + '/deployment/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    if(resultData.target.estimatorName !== null){
                        $('#estimator_name').text(resultData.target.estimatorName)
                    }else{
                        $('#estimator_name').text(resultData.target.estimator)
                    }

                    $('#score').text(resultData.target.score)
                    $('#created_at').text(resultData.createdAt)
                    $('#deployed').show()
                } else {
                    $('#not_deployed').show()
                    console.log(resultData['error_msg'])
                }
            },
            error: function (res) {
                $('#not_deployed').show()
                console.log(res.responseJSON.message)
            }
        })
    }

    _p.getColumns = function(){
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE +'runtimes/'+runtime_id + '/dataset/columns/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    var tablehtml = ""
                    columns = []
                    $(resultData).each(function(index, column) {
                        if(column.isFeature === true){
                            tablehtml += '<tr><td>'+column.name+'</td><td>'+column.datatype+'</td><td><input type="text" class="form-control predict-input" mostFrequent="'+column.mostFrequent+'"></td></tr>'
                            columns.push(column.name)
                        }
                    })
                    $('#predict_table').html(tablehtml)
                } else {
                    console.log(resultData['error_msg'])
                }
            },
            error: function (res) {
                console.log(res.responseJSON.message)
            }
        })
    }

    _p.fillMostFrequent = function(){
        $(".predict-input").each(function(index, value) {
            $(this).val($(this).attr("mostFrequent"))
        })
    }

    _p.singlePredict = function(){
        var data = {}
        inputstring ='{'
        len = $(".predict-input").length
        $(".predict-input").each(function(index, value) {
            inputstring+='"'+columns[index]+'"'+':'
            inputstring+='"'+$(this).val()+'"'
            if(index+1 < len) inputstring+= ','
        })
        inputstring+='}'

        data.inputs = inputstring

        return $.ajax({
            type: 'post',
            url: g_RESTAPI_HOST_BASE +'runtimes/'+ runtime_id + '/deployment/predict/',
            data: data,
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    var tablehtml = ""
                    tablehtml += '<tr><td>'+resultData.result+'</td><td>'+resultData.error+'</td></tr>'
                    $('#single_result_tbody').html(tablehtml)
                    $('#single_result_lime iframe').attr('srcdoc', resultData.lime.asHtml)
                    $('#single_result').show()
                } else {
                    console.log(resultData['error_msg'])
                }
            },
            error: function (res) {
                alert(res.responseJSON.message)
            }
        })
    }

    // _p.bulkPredict = function(){
    //     var data = {}
    //
    //     data.inputs = $('#outlined-textarea').val()
    //
    //     return $.ajax({
    //         type: 'post',
    //         url: g_RESTAPI_HOST_BASE +'runtimes/'+runtime_id + '/deployment/predict/',
    //         data: data,
    //         dataType: 'json',
    //         success: function (resultData, textStatus, request) {
    //             if (resultData['error_msg'] == null ){
    //                 var tablehtml = ""
    //                 $(resultData.inputs).each(function(index, value) {
    //                     tablehtml += '<tr><td>'+value+'</td><td>'+resultData.result[index]+'</td><td>'+resultData.errors[index]+'</td></tr>'
    //                 })
    //                 $('#bulk_result_tbody').html(tablehtml)
    //                 $('#bulk_result').show()
    //             } else {
    //                 console.log(resultData['error_msg'])
    //             }
    //         },
    //         error: function (res) {
    //             alert(res.responseJSON.message)
    //         }
    //     })
    // }


    return module;
}($FRONTEND || {}));
