var $FRONTEND = (function (module) {
    var _p = module._p = module._p || {};


    _p.dataset_name ="";
    //초기화면 세팅
    _p.init = function(){
        _p.loadStatus()
        _p.refreshOrigTable()

        $('#original_table').on('load-success.bs.table', function (data, jqXHR) {



        })




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
                    var corr = JSON.parse(resultData['corrJson'] );
                    corr.data =[];
                    for(var i = 0; i < corr.z.length; i++) {
                        for(var j = 0; j < corr.z[i].length; j++) {
                            corr.data.push([i,j,corr.z[i][j]]);
                        }
                    }
                    _p.drawCorrelation(corr);
                    if(resultData['isProcessed']===false){
                        $('#preprocessed_link').hide()                    }
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

    _p.refreshOrigTable = function () {
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id+'/dataset/source_X/',
            contentType: "application/json",
            success: function (resultData, textStatus, request) {
                var columns =[]
                $.each(resultData[0], function(key, value){
                    columns.push({
                        title: key,
                        field: key
                    })
                });

                var table_data = resultData

                $.ajax({
                    type: 'get',
                    url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id+'/dataset/source_y/',
                    contentType: "application/json",
                    success: function (resultData, textStatus, request) {

                        $.each(resultData[0], function(key, value){
                            columns.push({
                                title: key,
                                field: key
                            })
                        });
                        $('#original_table').bootstrapTable({
                            columns: columns
                        })
                        $.each(resultData, function(index, value){
                            $.each(value, function(key, value){
                                table_data[index][key] = value
                            });
                        })


                        $('#original_table').bootstrapTable('load',{rows: table_data})

                    },
                    error: function (res) {
                        console.log(res);
                    }
                });

            },
            error: function (res) {
                console.log(res);
            }
        });


    }

    _p.loadPreprocessed = function () {
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id+'/dataset/preprocessed_X/',
            contentType: "application/json",
            success: function (resultData, textStatus, request) {
                columns =[]
                $.each(resultData[0], function(key, value){
                    columns.push({
                        title: key,
                        field: key
                    })
                });

                table_data = resultData

                $.ajax({
                    type: 'get',
                    url: g_RESTAPI_HOST_BASE+'runtimes/'+runtime_id+'/dataset/preprocessed_y/',
                    contentType: "application/json",
                    success: function (resultData, textStatus, request) {

                        $.each(resultData[0], function(key, value){
                            columns.push({
                                title: key,
                                field: key
                            })
                        });
                        $('#preprocessed_table').bootstrapTable({
                            columns: columns
                        })
                        $.each(resultData, function(index, value){
                            $.each(value, function(key, value){
                                table_data[index][key] = value
                            });
                        })
                        console.log(table_data)

                        $('#preprocessed_table').bootstrapTable('load',{rows: table_data})

                    },
                    error: function (res) {
                        console.log(res);
                    }
                });

            },
            error: function (res) {
                console.log(res);
            }
        });
    }





    return module;
}($FRONTEND || {}));
