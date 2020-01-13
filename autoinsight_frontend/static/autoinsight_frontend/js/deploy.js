var $FRONTEND = (function (module) {
    var _p = module._p = module._p || {};

    _p.getStatus = function(){
        return $.ajax({
            type: 'get',
            url: '/autoinsight_restapi/get_progress',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData['error_msg'] == null ){
                    if(resultData['live']===true){
                        $('#loader').addClass("loader");
                    }else{
                        $('#loader').removeClass("loader");
                    }
                } else {
                    console.log(resultData['error_msg']);
                }
            },
            error: function (res) {
                console.log("Ajax call failure");
            }
        })
    };

    return module;
}($FRONTEND || {}));
